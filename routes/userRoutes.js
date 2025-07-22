const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

router.post(
  '/', 
  auth,
  roleGuard([ROLES.OWNER, ROLES.MANAGER]),
  userController.createUser
);

router.get(
  '/', 
  auth,
  roleGuard([ROLES.OWNER, ROLES.MANAGER]),
  userController.getUsers
);

module.exports = router;