const express = require('express');
const app = express();
const db = require("./models/models");
const api = require("./routes/routes");

const addCacheControlHeader = (req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache');
  next();
};

app.use(express.json())

app.use(addCacheControlHeader);

db.initializeDatabase()
  .then(() => {
    console.log("Database initialized and models synced.");
  })
  .catch((err) => {
    console.log("Failed to initialize database and sync models: " + err.message);
  });

app.use("/", api);

app.all('*', (req, res) => {
  res.status(404).send();
});

app.listen(3000, function () {
  console.log('Server running on port 3000!');
});
