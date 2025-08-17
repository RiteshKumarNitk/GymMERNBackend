// routes/planRoutes.js
const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

router.post(
  '/',
  auth,
  roleGuard([ROLES.MANAGER, ROLES.OWNER]),
  planController.createPlan
);

router.get(
  '/',
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER, ROLES.TRAINER]),
  planController.getPlans
);

module.exports = router;