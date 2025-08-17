// routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

// Create a new member
router.post(
  '/',
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER]),
  memberController.createMember
);

// Get all members
router.get(
  '/',
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER, ROLES.TRAINER]),
  memberController.getMembers
);

// Get a single member
router.get(
  '/:id',
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER, ROLES.TRAINER]),
  memberController.getMember
);

// Update a member
router.put(
  '/:id',
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER]),
  memberController.updateMember
);

// Delete a member
router.delete(
  '/:id',
  auth,
  roleGuard([ROLES.MANAGER, ROLES.OWNER]),
  memberController.deleteMember
);

module.exports = router;