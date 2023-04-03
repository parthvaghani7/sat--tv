const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use("/", express.static(path.join(__dirname, "/dist")));
app.use("/api", require("./api"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/dist/index.html"));
});

app.use((err, req, res, next) => {
  res.status(400).json({
    error: err.message,
  });
  next();
});

app.listen(5000, () => console.log("Server is running on 5000"));

module.exports = app;
