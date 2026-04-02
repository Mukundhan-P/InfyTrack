const { db, auth } = require('../firebase');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// ── STUDENT REGISTER ──────────────────────────────────
exports.registerStudent = async (req, res) => {
  try {
    const { email, password, name, registerNumber, department, year, section, phone, college, gender } = req.body;
    if (!email || !password || !name || !registerNumber) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    // Check duplicate register number
    const existing = await db.collection('students').where('registerNumber', '==', registerNumber).get();
    if (!existing.empty) {
      return res.status(400).json({ message: 'Register number already exists.' });
    }

    // Create Firebase Auth user (disabled until admin approves)
    const userRecord = await auth.createUser({ email, password, displayName: name, disabled: true });

    // Save student profile in Firestore with status 'pending'
    await db.collection('students').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      registerNumber,
      department,
      year,
      section,
      phone,
      college,
      gender,
      domain: '',
      cgpa: '',
      arrears: '',
      courses: '0',
      certs: '0',
      accommodation: '',
      native: '',
      bus: '',
      plan: '',
      role: 'student',
      status: 'pending',   // pending | approved | rejected
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Registration request sent. Awaiting admin approval.' });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
};

// ── STUDENT LOGIN ─────────────────────────────────────
exports.loginStudent = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'ID token required.' });

    // Verify Firebase ID token
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Get student profile
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ message: 'Student profile not found.' });

    const student = doc.data();

    if (student.status === 'pending') {
      return res.status(403).json({ message: 'Your registration is pending admin approval.' });
    }
    if (student.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration was rejected by admin.' });
    }

    const token = jwt.sign({ uid, role: 'student', email: student.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful.', token, student });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.', error: error.message });
  }
};

// ── ADMIN LOGIN ───────────────────────────────────────
exports.loginAdmin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'ID token required.' });

    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const doc = await db.collection('admins').doc(uid).get();
    if (!doc.exists) return res.status(403).json({ message: 'Not an admin account.' });

    const admin = doc.data();
    const token = jwt.sign({ uid, role: admin.role, email: admin.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Admin login successful.', token, admin });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.', error: error.message });
  }
};

// ── GET CURRENT USER PROFILE ──────────────────────────
exports.getMe = async (req, res) => {
  try {
    const { uid, role } = req.user;
    const collection = role === 'student' ? 'students' : 'admins';
    const doc = await db.collection(collection).doc(uid).get();
    if (!doc.exists) return res.status(404).json({ message: 'Profile not found.' });
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
