const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

router.post(
  '/',
  auth,
  roleGuard([ROLES.MANAGER, ROLES.OWNER, ROLES.TRAINER]),
  taskController.assignTask
);

module.exports = router;