const { db } = require("../firebase");

exports.submitParticipation = async (req, res) => {
  try {
    const { studentId, programId, details } = req.body;
    const participationRef = db.collection("participations");
    const newParticipationRef = await participationRef.add({ studentId, programId, details, status: "Submitted", createdAt: new Date() });
    res.status(201).json({ message: "Participation submitted successfully", id: newParticipationRef.id });
  } catch (error) {
    res.status(500).json({ message: "Error submitting participation", error: error.message });
  }
};

exports.getStudentParticipation = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const participationsRef = db.collection("participations");
    const snapshot = await participationsRef.where("studentId", "==", studentId).get();
    const participations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(participations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student participation", error: error.message });
  }
};
