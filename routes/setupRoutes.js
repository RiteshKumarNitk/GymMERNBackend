const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');

router.post('/superadmin', setupController.createSuperAdmin);

module.exports = router;
