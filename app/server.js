const express = require('express');
const healthRouter = require("./routes/health.router");
const extensionRoutes = require('./routes/extension.router');
const cookieParser = require('cookie-parser');

const fpExtension = require("./extension/index");
const { getExtensionInstanceHandler } = require('./extension/extension');

getExtensionInstanceHandler();

const app = express();

app.use(cookieParser("ext.session"));

// app.use("/", fpExtension.fdkHandler)

app.use("/", healthRouter);
app.use("/", extensionRoutes);
// app.use("/", extensionRouter.routes);
module.exports = app;