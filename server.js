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

db.database.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });


app.use("/", api);

app.all('*', (req, res) => {
  res.status(404).send();
});

app.listen(3000, function () {
  console.log('Server running on port 3000!');
});