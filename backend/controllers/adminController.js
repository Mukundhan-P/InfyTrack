const { db, auth } = require('../firebase');

// ── GET ALL PENDING REGISTRATIONS ─────────────────────
exports.getPendingStudents = async (req, res) => {
  try {
    const snapshot = await db.collection('students').where('status', '==', 'pending').get();
    const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── APPROVE STUDENT REGISTRATION ─────────────────────
exports.approveStudent = async (req, res) => {
  try {
    const { uid } = req.params;
    // Enable Firebase Auth account
    await auth.updateUser(uid, { disabled: false });
    // Update Firestore status
    await db.collection('students').doc(uid).update({ status: 'approved', approvedAt: new Date().toISOString() });
    res.status(200).json({ message: 'Student approved successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── REJECT STUDENT REGISTRATION ──────────────────────
exports.rejectStudent = async (req, res) => {
  try {
    const { uid } = req.params;
    const { reason } = req.body;
    // Disable Firebase Auth account
    await auth.updateUser(uid, { disabled: true });
    // Update Firestore status
    await db.collection('students').doc(uid).update({
      status: 'rejected',
      rejectionReason: reason || 'Not specified',
      rejectedAt: new Date().toISOString(),
    });
    res.status(200).json({ message: 'Student rejected.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET ALL APPROVED STUDENTS ─────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const snapshot = await db.collection('students').where('status', '==', 'approved').get();
    const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET DASHBOARD STATS ───────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [studentsSnap, docsSnap, partsSnap] = await Promise.all([
      db.collection('students').where('status', '==', 'approved').get(),
      db.collection('documents').get(),
      db.collection('participation').get(),
    ]);

    const docs = docsSnap.docs.map(d => d.data());
    const parts = partsSnap.docs.map(d => d.data());

    res.status(200).json({
      totalStudents: studentsSnap.size,
      enrolled: parts.length,
      completed: parts.filter(p => p.status === 'Completed').length,
      verifiedDocs: docs.filter(d => d.status === 'Verified').length,
      pendingDocs: docs.filter(d => d.status === 'Under Review').length,
      rejectedDocs: docs.filter(d => d.status === 'Rejected').length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
