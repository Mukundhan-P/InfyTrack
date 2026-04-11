const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken, requireStudent, requireAdmin } = require('../middleware/auth');

// Student uploads a PDF
router.post('/', verifyToken, requireStudent, uploadController.uploadMiddleware, uploadController.submitDocument);
// Student views their own documents
router.get('/my', verifyToken, requireStudent, uploadController.getMyDocuments);
// Admin views all documents
router.get('/all', verifyToken, requireAdmin, uploadController.getAllDocuments);

module.exports = router;
