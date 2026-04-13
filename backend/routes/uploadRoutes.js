const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken, requireStudent, requireAdmin } = require('../middleware/auth');
const { db } = require('../firebase');

// Submit Google Drive link (student or faculty)
router.post('/link', verifyToken, async (req, res) => {
  try {
    const { programName, docType, driveLink, description } = req.body;
    const { uid, email, role } = req.user;
    if (!programName || !docType || !driveLink) return res.status(400).json({ message: 'Program name, document type and drive link are required.' });
    if (!driveLink.startsWith('http')) return res.status(400).json({ message: 'Please provide a valid URL.' });
    const collection = role === 'faculty' ? 'faculty' : 'students';
    const profileDoc = await db.collection(collection).doc(uid).get();
    if (!profileDoc.exists) return res.status(404).json({ message: 'Profile not found.' });
    const profile = profileDoc.data();
    const docRef = await db.collection('documents').add({
      studentUid: uid, studentEmail: email,
      studentName: profile.name, department: profile.department,
      registerNumber: profile.registerNumber || '',
      uploaderRole: role || 'student',
      programName, docType, driveLink,
      description: description || '',
      status: 'Under Review', adminRemark: '',
      submittedAt: new Date().toISOString(), reviewedAt: null,
    });
    res.status(201).json({ message: 'Document submitted successfully.', id: docRef.id });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Student/Faculty uploads a PDF
router.post('/', verifyToken, uploadController.uploadMiddleware, uploadController.submitDocument);

// Student/Faculty views their own documents
router.get('/my', verifyToken, uploadController.getMyDocuments);

// Admin views all documents
router.get('/all', verifyToken, requireAdmin, uploadController.getAllDocuments);

module.exports = router;
