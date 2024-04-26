const express = require('express');
const healthRouter = require("./routes/health.router");
const extensionRoutes = require('./routes/extension.router');
const cookieParser = require('cookie-parser');


const app = express();

app.use(cookieParser("ext.session"));


app.use("/", healthRouter);
app.use("/extension", extensionRoutes);
// app.use("/", extensionRouter.routes);
module.exports = app;