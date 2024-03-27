const { database, user } = require("../models/models");
const bcrypt = require('bcrypt');
const validator = require('validator');
const logger = require('../logger');
const { PubSub } = require('@google-cloud/pubsub');
const pubSubClient = new PubSub();
const { v4: uuidv4 } = require('uuid');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      logger.warn('Authentication failed: No auth header or not Basic auth', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
      return res.status(401).send();
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = decodedCredentials.split(':');

    const _user = await user.findOne({ where: { username } });

    if (!_user || !(await bcrypt.compare(password, _user.password))) {
      logger.warn('Authentication failed: User not found or password does not match', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], username });
      return res.status(401).send();
    }

    req.user = { id: _user.dataValues.id };
    next();
  } catch (error) {
    logger.error('Error during authentication', { error: error.message, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'] });
    return res.status(503).send();
  }
}

exports.checks = {
  whiteListMethods: (req, res, next) => {
    if (req.method !== "GET") {
      logger.warn('Invalid method: Method not allowed', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
      return res.status(405).send();
    } else {
      next()
    }
  },

  checkPayload: (req, res, next) => {
    if (req.headers['content-length'] && req.headers['content-length'] !== "0") {
      logger.warn('Invalid payload: Content length is not zero', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
      res.status(400).send()
    } else if (Object.keys(req.query).length > 0) {
      logger.warn('Invalid payload: Query parameters present', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
      res.status(400).send()
    } else {
      next()
    }
  },

  verifyUser: async (req, res, next) => {
    const userId = req.user.id;
    // Check if environment is 'test', then bypass verification
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    const _user = await user.findOne({ where: { id: userId } });
    if (!_user || !_user.verified) {
      return res.status(403).json({ error: 'User account not verified' });
    }

    next();
  }
}

exports.userManagement = {
  healthcheck: async (req, res) => {
    try {
      await database.authenticate()
      logger.info('Database connection successful', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'] });
      res.status(200).send()
    } catch (error) {
      logger.error('Database connection error', { error: error.message, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'] });
      res.status(503).send()
    }
  },

  createUser: async (req, res) => {
    const self = this;
    const domain = req.headers.host;
    try {
      if (Object.keys(req.query).length > 0) {
        logger.debug('Received query parameters in createUser method', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'] });
        return res.status(400).send()
      }

      if (req.headers['content-length'] && req.headers['content-length'] !== "0") {
        if (!req.body.username || !req.body.password || !req.body.first_name || !req.body.last_name) {
          logger.debug('Invalid payload: Required fields missing in createUser method', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'] });
          return res.status(400).send();
        } else {
          const allowedFields = ["first_name", "last_name", "password", "username"]
          const checkFields = self.userManagement.allowedFields(allowedFields, req)
          if (checkFields.length > 0) {
            logger.warn('Invalid payload: Invalid field(s) present', { fields: checkFields, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
            return res.status(400).send()
          }

          if (!validator.isEmail(req.body.username)) {
            logger.debug('Invalid email format', { email: req.body.username, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
            return res.status(400).send();
          }

          const { username, password, first_name, last_name } = req.body
          const existingUser = await user.findOne({ where: { username: username } });

          if (existingUser) {
            logger.warn('User already exists', { username: username, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
            return res.status(400).send()
          }

          const hashedPassword = await self.userManagement.hashpass(password)
          const newUser = await user.create({
            username: username,
            password: hashedPassword,
            first_name: first_name,
            last_name: last_name,
            verified: false,
            verificationToken: uuidv4(), // add this line
            //tokenExpiryDate: Date.now() + 120000 // 2 minutes from now
          })

          // Prepare the payload with relevant information
          const payload = {
            userId: newUser.id,
            username: newUser.username,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            email: newUser.username, // Assuming the username is the email
            verified: newUser.verified,
            verificationToken: newUser.verificationToken,
            //tokenExpiryDate: newUser.tokenExpiryDate,
            verificationLink: `http://${domain}/verify?token=${newUser.verificationToken}`
          };

          console.log(payload, "payload")

          if (process.env.NODE_ENV !== 'test') {
            // Publish the message to the Pub/Sub topic
            const dataBuffer = Buffer.from(JSON.stringify(payload));
            const messageId = await pubSubClient
              .topic('verify_email')
              .publish(dataBuffer);

            console.log(`Message ${messageId} published.`);
          }

          const userResponse = newUser.toJSON();
          userResponse.verificationLink = payload.verificationLink
          delete userResponse.password;

          logger.info('User created successfully', { username: req.body.username, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
          return res.status(201).json(userResponse);
        }
      }
    } catch (error) {
      console.log(error)
      logger.error('Error creating user', { error: error.message, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'] });

      return res.status(503).send()
    }
  },

  getUser: async (req, res) => {
    try {
      if (Object.keys(req.query).length > 0 || req.headers['content-length'] && req.headers['content-length'] !== "0") {
        logger.warn('Invalid request: Query parameters present or non-zero content length', { httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
        return res.status(400).send()
      }

      const userId = req.user.id;
      const _user = await user.findOne({
        attributes: { exclude: ['password'] },
        where: { id: userId },
      });

      if (!_user) {
        logger.warn('User not found', { userId: req.user.id, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
        return res.status(404).json({ error: 'User not found' });
      }

      logger.info('User retrieved successfully', { userId: req.user.id, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
      return res.status(200).json(_user);
    } catch (error) {
      logger.error('Error retrieving user', { error: error.message, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'] });
      return res.status(503).send()
    }
  },

  updateUser: async (req, res) => {
    const self = this;
    try {
      // Log the incoming request for debugging
      logger.info('Update user request received', { body: req.body, userId: req.user.id, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });

      if (Object.keys(req.query).length > 0) {
        return res.status(400).send();
      }

      if (req.headers['content-length'] && req.headers['content-length'] !== "0") {
        if (!req.body.password || !req.body.first_name || !req.body.last_name) {
          return res.status(400).send();
        } else {
          const allowedFields = ["first_name", "last_name", "password"];
          const checkFields = self.userManagement.allowedFields(allowedFields, req);
          if (checkFields.length > 0) {
            return res.status(400).send();
          }

          const { password, first_name, last_name } = req.body;
          const userId = req.user.id;

          const existingUser = await user.findOne({ where: { id: userId } });

          if (!existingUser) {
            return res.status(400).send();
          }

          const hashedPassword = await self.userManagement.hashpass(password);
          console.log("reached here");
          const result = await user.update(
            {
              first_name: first_name,
              last_name: last_name,
              password: hashedPassword,
            },
            {
              where: { id: userId },
            }
          );

          logger.info('User updated successfully', { userId: req.user.id, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'], endpoint: req.originalUrl });
          return res.status(204).send();
        }
      }
    } catch (error) {
      //console.log(error);
      logger.error('Error updating user', { error: error.message, httpRequest: { requestMethod: req.method }, spanId: req.spanId, traceId: req.headers['logging.googleapis.com/trace'] });
      return res.status(503).send();
    }
  },

  hashpass: async function (password) {
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    return hashedPassword
  },

  allowedFields: (allowedFieldsarr, req) => {
    const _allowedFields = allowedFieldsarr;
    const receivedFields = Object.keys(req.body);
    const invalidFields = receivedFields.filter(field => !_allowedFields.includes(field));
    return invalidFields
  },

  verifyEmail: async function (req, res) {
    const { token } = req.query;
    const _user = await user.findOne({ where: { verificationToken: token } });
    if (!_user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }
    if (_user.tokenExpiryDate < Date.now()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }
    _user.verified = true;
    await _user.save();
    res.send('Your account has been verified');
  }
}
