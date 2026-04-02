const { db } = require('../firebase');

// ── ADMIN: VERIFY DOCUMENT ────────────────────────────
exports.verifyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    await db.collection('documents').doc(id).update({
      status: 'Verified',
      adminRemark: remark || '',
      reviewedAt: new Date().toISOString(),
    });
    res.status(200).json({ message: 'Document verified.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: REJECT DOCUMENT ────────────────────────────
exports.rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    if (!remark) return res.status(400).json({ message: 'Rejection reason is required.' });
    await db.collection('documents').doc(id).update({
      status: 'Rejected',
      adminRemark: remark,
      reviewedAt: new Date().toISOString(),
    });
    res.status(200).json({ message: 'Document rejected.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: REQUEST RE-UPLOAD ──────────────────────────
exports.requestReupload = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    await db.collection('documents').doc(id).update({
      status: 'Need Re-upload',
      adminRemark: remark || 'Please re-upload the document.',
      reviewedAt: new Date().toISOString(),
    });
    res.status(200).json({ message: 'Re-upload requested.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
