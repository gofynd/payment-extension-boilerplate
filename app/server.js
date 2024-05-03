const express = require('express');
const healthRouter = require("./routes/health.router");
const extensionRoutes = require('./routes/extension.router');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require("path");

const fpExtension = require("./extension/index");
const { getExtensionInstanceHandler } = require('./extension/extension');
const orderRouter = require('./routes/order.router');

getExtensionInstanceHandler();
const app = express();


app.use(cookieParser("ext.session"));
app.use(bodyParser.json({
    limit: '2mb'
  }));

// app.use("/", fpExtension.fdkHandler)

app.use("/", healthRouter);
app.use("/", extensionRoutes);
app.use("/api/v1", orderRouter)
// app.use("/", extensionRouter.routes);
app.get('/company/:company_id', (req, res) => {
    res.contentType('text/html');
      res.sendFile(path.resolve(__dirname, '../build/index.html'))
  })
  
  app.get('*', (req, res) => {
      res.contentType('text/html');
      res.sendFile(path.resolve(__dirname, '../build/index.html'))
  });

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
module.exports = app;