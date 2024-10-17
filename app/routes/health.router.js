const { Router } = require("homelander/router");


const healthRouter = new Router();

healthRouter.get(['/_livez', '/_healthz', '/_readyz'], (req, res, next) => {
    res.json({
        "ok": "ok"
    });
});


module.exports = {
    healthRouter: healthRouter.getRouter()
}
