const express = require('express');
const healthRouter = require("./routes/health.router");
const extensionRoutes = require('./routes/extension.router');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require("path");

const { getExtensionInstanceHandler } = require('./extension/extension');
const orderRouter = require('./routes/order.router');
const { credsRouter, apiRouter } = require('./routes/creds.router');
const CREDENTIAL_FIELDS = require('./common/formData');
const config = require('./config');

getExtensionInstanceHandler();
const app = express();


app.use(cookieParser("ext.session"));
app.use(bodyParser.json({
    limit: '2mb'
  }));

  app.use(express.urlencoded({ extended: false }))
// app.use("/", fpExtension.fdkHandler)

app.use("/", healthRouter);
app.use("/", extensionRoutes);
app.use('/api/v1', orderRouter);
app.use('/api/v1', credsRouter);
app.use('/protected/v1', apiRouter); // uncomment these lines for local and comment below 3 lines

// const apiRoutes = fdkExtension.apiRoutes; // comment
// apiRoutes.use('/v1', apiRouter); // comment
// app.use('/protected', apiRoutes); // comment

// app.use("/", extensionRouter.routes);
app.get('/company/:company_id', (req, res) => {
    res.contentType('text/html');
      res.sendFile(path.resolve(__dirname, '../build/index.html'))
  })

app.get('/company/:company_id/application/:application_id', (req, res) => {
    const fieldsArray = Object.values(CREDENTIAL_FIELDS);
    res.render('index', { fields: fieldsArray, app_id: req.params.application_id }); 
});

  
//   app.get('*', (req, res) => {
//       res.contentType('text/html');
//       res.sendFile(path.resolve(__dirname, '../build/index.html'))
//   });



app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

app.get('*', (req, res) => { 
    const fieldsArray = Object.values(CREDENTIAL_FIELDS);
    // res.render('index', { fields: fieldsArray, app_id: "65e9a30be1794f161cf385b3" }); 
}); 

module.exports = app;