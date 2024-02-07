const { database, user } = require("../models/models");

const bcrypt = require('bcrypt');
const validator = require('validator');

exports.authenticate = async (req, res, next) => {

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).send();
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = decodedCredentials.split(':');

    // Replace with your logic to retrieve user from the database
    const _user = await user.findOne({ where: { username } });

    if (!_user || !(await bcrypt.compare(password, _user.password))) {
      return res.status(401).send();
    }

    req.user = { id: _user.dataValues.id };
    next();
  } catch (error) {
    console.log(error);
    return res.status(503).send();
  }


}

exports.checks = {
  whiteListMethods: (req, res, next) => {
    //WhiteListing methods
    if (req.method !== "GET") {
      res.status(405).send();
    } else {
      next()
    }
  },

  checkPayload: (req, res, next) => {
    console.log(Object.keys(req.query).length > 0, "req")
    if (req.headers['content-length'] && req.headers['content-length'] !== "0") {
      res.status(400).send()
    } else if (Object.keys(req.query).length > 0) {
      res.status(400).send()
    } else {
      next()
    }
  }
}


exports.userManagement = {

  healthcheck: async (req, res) => {

    try {
      await database.authenticate()
      res.status(200).send()
    } catch (error) {
      console.log(error, "db connect error")
      res.status(503).send()
    }

  },


  createUser: async (req, res) => {
    const self = this
    try {

      //const { email, password, first_name, last_name } = req.body
      if (req.headers['content-length'] && req.headers['content-length'] !== "0") {

        if (!req.body.username || !req.body.password || !req.body.first_name || !req.body.last_name) {
          return res.status(400).send();
        } else {

          const allowedFields = ["first_name", "last_name", "password", "username"]
          const checkFields = self.userManagement.allowedFields(allowedFields, req)
          if (checkFields.length > 0) {
            return res.status(400).send()
          }

          if (!validator.isEmail(req.body.username)) {
            console.log(req.body.username, "username")
            return res.status(400).send();
          }

          const { username, password, first_name, last_name } = req.body
          const existingUser = await user.findOne({ where: { username: username } });

          if (existingUser) {
            console.log(existingUser, "existing user")
            return res.status(400).send()
          }


          const hashedPassword = await self.userManagement.hashpass(password)
          console.log(hashedPassword, "hashpassword")
          const newUser = await user.create({
            username: username,
            password: hashedPassword,
            first_name: first_name,
            last_name: last_name

          })

          const userResponse = newUser.toJSON();
          delete userResponse.password;

          return res.status(201).json(userResponse);
        }
      }

    } catch (error) {
      console.error(error);
      return res.status(503).send()
    }
  },


  getUser: async (req, res) => {
    try {

      if (req.headers['content-length'] && req.headers['content-length'] !== "0") {
        res.status(400).send()
      }

      const userId = req.user.id;
      const _user = await user.findOne({
        attributes: { exclude: ['password'] },
        where: { id: userId },
      });

      if (!_user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(_user);

    } catch (error) {
      console.log(error)
      return res.status(503).send()
    }
  },

  updateUser: async (req, res) => {
    const self = this
    try {

      if (req.headers['content-length'] && req.headers['content-length'] !== "0") {

        if (!req.body.password || !req.body.first_name || !req.body.last_name) {

          return res.status(400).send();
        } else {
          
          const allowedFields = ["first_name", "last_name", "password"]
          const checkFields = self.userManagement.allowedFields(allowedFields, req)
          if (checkFields.length > 0) {
            return res.status(400).send()
          }

          const { password, first_name, last_name } = req.body
          const userId = req.user.id

          const existingUser = await user.findOne({ where: { id: userId } });

          if (!existingUser) {

            return res.status(400).send()
          }

          //const { first_name, last_name, password } = req.body;
          const hashedPassword = await self.userManagement.hashpass(password)
          console.log("reached here")
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

          return res.status(204).send()

        }
      }

    } catch (error) {
      console.log(error);
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
  }
}