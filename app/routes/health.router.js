const express = require('express');

const healthRouter = express.Router();

healthRouter.get('/', (req, res, next) => {
    res.json({
        "ok": "ok"
    });
});


module.exports = healthRouter;
