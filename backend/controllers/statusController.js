const { db } = require("../firebase");

exports.getParticipationStatus = async (req, res) => {
  try {
    const { studentId, programId } = req.params;
    const participationsRef = db.collection("participations");
    const snapshot = await participationsRef
      .where("studentId", "==", studentId)
      .where("programId", "==", programId)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "Participation not found for this student and program." });
    }

    const participation = snapshot.docs[0].data();
    res.status(200).json({ id: snapshot.docs[0].id, ...participation });
  } catch (error) {
    res.status(500).json({ message: "Error fetching participation status", error: error.message });
  }
};

exports.updateParticipationStatus = async (req, res) => {
  try {
    const participationId = req.params.participationId;
    const { status } = req.body;
    const participationRef = db.collection("participations").doc(participationId);
    await participationRef.update({ status, updatedAt: new Date() });
    res.status(200).json({ message: `Participation status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Error updating participation status", error: error.message });
  }
};
