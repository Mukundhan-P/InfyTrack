const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

// Settings endpoints
router.get('/settings', async (req, res) => {
  try {
    const { db } = require('../firebase');
    const doc = await db.collection('admin_settings').doc('portal').get();
    res.json(doc.exists ? doc.data() : {});
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/settings', async (req, res) => {
  try {
    const { db } = require('../firebase');
    await db.collection('admin_settings').doc('portal').set(req.body, { merge: true });
    res.json({ message: 'Settings saved.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/bulk-action', async (req, res) => {
  try {
    const { db } = require('../firebase');
    const { action } = req.body;
    if (action === 'resetStudentStatus') {
      const snap = await db.collection('participation').get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.update(d.ref, { status: 'Doing' }));
      await batch.commit();
    } else if (action === 'resetFacultyStatus') {
      const snap = await db.collection('faculty_participation').get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.update(d.ref, { status: 'Doing' }));
      await batch.commit();
    }
    res.json({ message: 'Bulk action completed.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/students/pending', adminController.getPendingStudents);
router.get('/students', adminController.getAllStudents);
router.put('/students/:uid/approve', adminController.approveStudent);
router.put('/students/:uid/reject', adminController.rejectStudent);
router.get('/dashboard', adminController.getDashboardStats);
router.get('/report', adminController.getReportData);
router.get('/all-participation', async (req, res) => {
  try {
    const { db } = require('../firebase');
    const snap = await db.collection('participation').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn)));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/faculty-participation', async (req, res) => {
  try {
    const { db } = require('../firebase');
    const [partSnap, facSnap] = await Promise.all([
      db.collection('faculty_participation').get(),
      db.collection('faculty').get(),
    ]);
    const facMap = {};
    facSnap.docs.forEach(d => { facMap[d.id] = d.data(); });
    const parts = partSnap.docs.map(d => {
      const p = { id: d.id, ...d.data() };
      if (facMap[p.facultyUid]) p.designation = facMap[p.facultyUid].designation || '';
      return p;
    }).sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn));
    res.json(parts);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Save department summary snapshot to Firestore
router.post('/dept-summary', async (req, res) => {
  try {
    const { db } = require('../firebase');
    const { college, savedAt, students, faculty } = req.body;
    await db.collection('dept_summaries').doc(`${college}_${savedAt.split('T')[0]}`).set({
      college, savedAt, students, faculty, updatedAt: new Date().toISOString()
    }, { merge: true });
    res.json({ message: 'Summary saved.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/faculty/all', async (req, res) => {
  try {
    const { db } = require('../firebase');
    const snap = await db.collection('faculty').where('status', '==', 'approved').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/faculty/pending', async (req, res) => {
  try {
    const { db } = require('../firebase');
    const snap = await db.collection('faculty').where('status', '==', 'pending').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/faculty/:uid/approve', async (req, res) => {
  try {
    const { db, auth } = require('../firebase');
    await db.collection('faculty').doc(req.params.uid).update({ status: 'approved' });
    await auth.updateUser(req.params.uid, { disabled: false });
    res.json({ message: 'Faculty approved.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/faculty/:uid/reject', async (req, res) => {
  try {
    const { db } = require('../firebase');
    await db.collection('faculty').doc(req.params.uid).update({ status: 'rejected', rejectionReason: req.body.reason || '' });
    res.json({ message: 'Faculty rejected.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
