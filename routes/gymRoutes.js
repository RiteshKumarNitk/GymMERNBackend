const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

router.post('/', auth, roleGuard([ROLES.SUPERADMIN]), gymController.createGym);

router.put(
  '/profile',
  auth,
  roleGuard([ROLES.OWNER, ROLES.MANAGER]),
  gymController.updateGymProfile
);

router.get(
  '/profile',
  auth,
  roleGuard([ROLES.OWNER, ROLES.MANAGER]),
  gymController.getGymProfile
);


module.exports = router;