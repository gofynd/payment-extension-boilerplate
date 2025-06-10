const express = require('express');

class CredsService {
  constructor(handlers = {}) {
    if (!handlers.createSecrets || !handlers.getSecrets) {
      throw new Error('Required handlers missing for CredsService');
    }
    
    this.createSecrets = handlers.createSecrets;
    this.getSecrets = handlers.getSecrets;
  }

  registerRoutes(app) {
    const router = express.Router();

    // Register credential routes
    router.get('/secrets/:app_id', this.getSecrets);
    router.post('/secrets', this.createSecrets);

    // Mount the router
    app.use('/api/v1', router);
  }
}

module.exports = { CredsService }; 