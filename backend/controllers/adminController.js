const { db, auth } = require('../firebase');

exports.getPendingStudents = async (req, res) => {
  try {
    const snap = await db.collection('students').where('status', '==', 'pending').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approveStudent = async (req, res) => {
  try {
    const { uid } = req.params;
    await auth.updateUser(uid, { disabled: false });
    await db.collection('students').doc(uid).update({ status: 'approved', approvedAt: new Date().toISOString() });
    res.json({ message: 'Student approved.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.rejectStudent = async (req, res) => {
  try {
    const { uid } = req.params;
    const { reason } = req.body;
    await auth.updateUser(uid, { disabled: true });
    await db.collection('students').doc(uid).update({ status: 'rejected', rejectionReason: reason || 'Not specified', rejectedAt: new Date().toISOString() });
    res.json({ message: 'Student rejected.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { dept, year } = req.query;
    let q = db.collection('students').where('status', '==', 'approved');
    const snap = await q.get();
    let students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (dept) students = students.filter(s => s.department === dept);
    if (year) students = students.filter(s => s.year === year);
    res.json(students);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { role, college } = req.query;

    // Engineering = St. Joseph's College of Engineering
    // Technology  = St. Joseph's Institute of Technology
    const collegeMap = {
      engineering: "St. Joseph's College of Engineering",
      technology:  "St. Joseph's Institute of Technology",
    };
    const collegeFilter = college ? collegeMap[college] : null;

    const [studSnap, facSnap, docsSnap, partsSnap, facPartsSnap, pendingStudSnap, pendingFacSnap] = await Promise.all([
      db.collection('students').where('status', '==', 'approved').get(),
      db.collection('faculty').where('status', '==', 'approved').get(),
      db.collection('documents').get(),
      db.collection('participation').get(),
      db.collection('faculty_participation').get(),
      db.collection('students').where('status', '==', 'pending').get(),
      db.collection('faculty').where('status', '==', 'pending').get(),
    ]);

    let students = studSnap.docs.map(d => d.data());
    let faculty  = facSnap.docs.map(d => d.data());
    let parts    = partsSnap.docs.map(d => d.data());
    let facParts = facPartsSnap.docs.map(d => d.data());
    let docs     = docsSnap.docs.map(d => d.data());

    // Apply college filter
    if (collegeFilter) {
      students = students.filter(s => s.college === collegeFilter);
      faculty  = faculty.filter(f => f.college === collegeFilter);
      const studentUids = new Set(studSnap.docs.filter(d => d.data().college === collegeFilter).map(d => d.id));
      const facUids     = new Set(facSnap.docs.filter(d => d.data().college === collegeFilter).map(d => d.id));
      parts    = parts.filter(p => studentUids.has(p.studentUid));
      facParts = facParts.filter(p => facUids.has(p.facultyUid));
      docs     = docs.filter(d => studentUids.has(d.studentUid) || facUids.has(d.studentUid));
    }

    // Apply role filter
    const showStudents = !role || role === 'students';
    const showFaculty  = !role || role === 'faculty';

    const activeParts = [
      ...(showStudents ? parts : []),
      ...(showFaculty  ? facParts : []),
    ];
    const activeMembers = [
      ...(showStudents ? students : []),
      ...(showFaculty  ? faculty  : []),
    ];
    const activeDocs = showStudents && !showFaculty
      ? docs.filter(d => d.uploaderRole !== 'faculty')
      : showFaculty && !showStudents
      ? docs.filter(d => d.uploaderRole === 'faculty')
      : docs;

    const pendingCount = (showStudents ? pendingStudSnap.size : 0) + (showFaculty ? pendingFacSnap.size : 0);

    res.json({
      totalStudents:   showStudents ? students.length : 0,
      totalFaculty:    showFaculty  ? faculty.length  : 0,
      totalMembers:    activeMembers.length,
      pendingApprovals: pendingCount,
      enrolled:        activeParts.length,
      completed:       activeParts.filter(p => p.status === 'Completed').length,
      verifiedDocs:    activeDocs.filter(d => d.status === 'Verified').length,
      pendingDocs:     activeDocs.filter(d => d.status === 'Under Review').length,
      rejectedDocs:    activeDocs.filter(d => d.status === 'Rejected').length,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getReportData = async (req, res) => {
  try {
    const { dept, year, program, status, type, college } = req.query;

    const COLLEGE_MAP = {
      engineering: "St. Joseph's College of Engineering",
      technology:  "St. Joseph's Institute of Technology",
    };
    const collegeFilter = college ? (COLLEGE_MAP[college] || college) : null;

    const [studSnap, partsSnap, docsSnap] = await Promise.all([
      db.collection('students').where('status', '==', 'approved').get(),
      db.collection('participation').get(),
      db.collection('documents').get(),
    ]);

    let students = studSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let parts = partsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let docs = docsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Apply college filter
    if (collegeFilter) {
      const collegeUids = new Set(students.filter(s => s.college === collegeFilter).map(s => s.uid || s.id));
      students = students.filter(s => s.college === collegeFilter);
      parts = parts.filter(p => collegeUids.has(p.studentUid));
      docs   = docs.filter(d => collegeUids.has(d.studentUid));
    }

    if (dept)    { students = students.filter(s => s.department === dept); parts = parts.filter(p => p.department === dept); }
    if (year)    { students = students.filter(s => s.year === year);        parts = parts.filter(p => p.year === year); }
    if (program) parts = parts.filter(p => p.programName === program);
    if (status)  parts = parts.filter(p => p.status === status);

    if (type === 'documents') {
      return res.json(docs.map(d => ({
        'Student Name': d.studentName, 'Register No': d.registerNumber,
        Department: d.department, 'Program Name': d.programName,
        'Doc Type': d.docType, Status: d.status,
        'Admin Remark': d.adminRemark || '', 'Submitted At': d.submittedAt,
        'Drive Link': d.driveLink,
      })));
    }

    res.json(parts.map(p => ({
      'Student Name': p.name, Department: p.department, Batch: p.year,
      'Program Name': p.programName, 'Program Type': p.programType || '',
      'Reg ID': p.regId || '', 'Enroll Date': p.enrollDate || '',
      Status: p.status, 'Submitted On': p.submittedOn,
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};
