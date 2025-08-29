const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const ROLES = require("../config/roles");
const multer = require("multer");

// Multer config - store image in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create member (with image upload + password in body)
router.post(
  "/",
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER]),
  upload.single("image"),
  memberController.createMember
);

// Get all members
router.get(
  "/",
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER, ROLES.TRAINER]),
  memberController.getMembers
);

// Get member image by ID
router.get(
  "/:id/image",
  auth,
  roleGuard([ROLES.FRONTDESK, ROLES.MANAGER, ROLES.OWNER, ROLES.TRAINER]),
  memberController.getMemberImage
);

module.exports = router;
