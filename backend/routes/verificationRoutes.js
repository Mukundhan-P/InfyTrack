const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.put('/:id/verify', verifyToken, requireAdmin, verificationController.verifyDocument);
router.put('/:id/reject', verifyToken, requireAdmin, verificationController.rejectDocument);
router.put('/:id/reupload', verifyToken, requireAdmin, verificationController.requestReupload);

module.exports = router;
