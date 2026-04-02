const { db } = require("../firebase");

exports.addProgram = async (req, res) => {
  try {
    const { name, description } = req.body;
    const programRef = db.collection("programs");
    const newProgramRef = await programRef.add({ name, description });
    res.status(201).json({ message: "Program added successfully", id: newProgramRef.id });
  } catch (error) {
    res.status(500).json({ message: "Error adding program", error: error.message });
  }
};

exports.getAllPrograms = async (req, res) => {
  try {
    const programsRef = db.collection("programs");
    const snapshot = await programsRef.get();
    const programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching programs", error: error.message });
  }
};

exports.updateProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const updatedData = req.body;
    const programRef = db.collection("programs").doc(programId);
    await programRef.update(updatedData);
    res.status(200).json({ message: "Program updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating program", error: error.message });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const programRef = db.collection("programs").doc(programId);
    await programRef.delete();
    res.status(200).json({ message: "Program deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting program", error: error.message });
  }
};
