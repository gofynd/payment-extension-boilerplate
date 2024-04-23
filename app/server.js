const express = require('express');
const healthRouter = require("./routes/health.router");
const extensionRouter = require("./routes/exextension.router");

const app = express();

app.use("/", healthRouter);
app.use("/extension", extensionRouter);

module.exports = app;