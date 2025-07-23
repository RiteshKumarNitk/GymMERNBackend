const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles'); // Make sure this exists


router.post(
  '/',
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER]), // Fixed
  trainerController.createTrainer
);

// Add other trainer routes (GET, PUT, DELETE) here...

module.exports = router;