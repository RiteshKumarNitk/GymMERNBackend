const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');
const roleGuard = require('../middleware/roleGuard');

router.post('/', roleGuard(['superadmin']), gymController.createGym);

module.exports = router;