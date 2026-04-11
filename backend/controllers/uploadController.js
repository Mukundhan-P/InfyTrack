const { db, bucket } = require('../firebase');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed.'));
  },
});

exports.uploadMiddleware = upload.single('pdf');

// ── STUDENT UPLOADS PDF ───────────────────────────────
exports.submitDocument = async (req, res) => {
  try {
    const { programName, docType, description } = req.body;
    const { uid, email } = req.user;

    if (!req.file) return res.status(400).json({ message: 'PDF file is required.' });
    if (!programName || !docType) return res.status(400).json({ message: 'Program name and document type are required.' });

    const studentDoc = await db.collection('students').doc(uid).get();
    if (!studentDoc.exists) return res.status(404).json({ message: 'Student not found.' });
    const student = studentDoc.data();

    // Upload PDF to Firebase Storage
    const fileName = `documents/${uid}/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
    const file = bucket.file(fileName);
    await file.save(req.file.buffer, { metadata: { contentType: 'application/pdf' } });
    await file.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    const docRef = await db.collection('documents').add({
      studentUid: uid,
      studentEmail: email,
      studentName: student.name,
      department: student.department,
      registerNumber: student.registerNumber,
      programName,
      docType,
      fileUrl,
      fileName: req.file.originalname,
      description: description || '',
      status: 'Under Review',
      adminRemark: '',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    });

    res.status(201).json({ message: 'Document uploaded successfully.', id: docRef.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET STUDENT'S OWN DOCUMENTS ───────────────────────
exports.getMyDocuments = async (req, res) => {
  try {
    const { uid } = req.user;
    const snapshot = await db.collection('documents').where('studentUid', '==', uid).get();
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: GET ALL DOCUMENTS ──────────────────────────
exports.getAllDocuments = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.collection('documents');
    if (status) query = query.where('status', '==', status);
    const snapshot = await query.get();
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
