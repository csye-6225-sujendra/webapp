const express = require('express');
const app = express();
const db = require("./models/models");
const api = require("./routes/routes");
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger'); // Import logger module

const addSpanId = (req, res, next) => {
  req.spanId = uuidv4(); // Generate unique ID for each request
  next();
};

const addCacheControlHeader = (req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache');
  next();
};

app.use(express.json())

app.use(addSpanId);

app.use(addCacheControlHeader);

db.initializeDatabase()
  .then(() => {
    logger.info("Database initialized and models synced."); // Log success message
  })
  .catch((err) => {
    logger.error("Failed to initialize database and sync models: " + err.message); // Log error message
  });

app.use("/", api);

app.all('*', (req, res) => {
  res.status(404).send();
});

app.listen(8080, function () {
  logger.info('Server running on port 8080!'); // Log server start message
});

module.exports = app;
