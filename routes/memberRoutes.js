// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

router.post(
  '/',
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER]),
  memberController.createMember
);

router.get(
  '/',
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER, ROLES.TRAINER]),
  memberController.getMembers
);

module.exports = router;