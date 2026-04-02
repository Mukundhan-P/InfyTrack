const { db } = require("../firebase");

exports.generateStudentReport = async (req, res) => {
  try {
    const studentId = req.params.id;
    const studentDoc = await db.collection("students").doc(studentId).get();

    if (!studentDoc.exists) {
      return res.status(404).json({ message: "Student not found." });
    }

    const studentData = { id: studentDoc.id, ...studentDoc.data() };

    const participationsSnapshot = await db.collection("participations").where("studentId", "==", studentId).get();
    const participations = [];
    for (const doc of participationsSnapshot.docs) {
      const participationData = { id: doc.id, ...doc.data() };
      if (participationData.programId) {
        const programDoc = await db.collection("programs").doc(participationData.programId).get();
        participationData.programDetails = programDoc.exists ? programDoc.data() : null;
      }
      participations.push(participationData);
    }

    res.status(200).json({
      message: `Report for student ID: ${studentId}`,
      student: studentData,
      participations: participations,
      // Placeholder for PDF/Excel generation logic
      // For actual PDF/Excel export, you would use libraries like pdfkit or exceljs here.
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating student report", error: error.message });
  }
};

exports.generateDepartmentReport = async (req, res) => {
  try {
    const departmentName = req.params.name;
    const studentsSnapshot = await db.collection("students").where("department", "==", departmentName).get();
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const departmentReport = {
      department: departmentName,
      totalStudents: students.length,
      students: students,
      // Placeholder for PDF/Excel generation logic
    };

    res.status(200).json({
      message: `Report for department: ${departmentName}`,
      report: departmentReport,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating department report", error: error.message });
  }
};

exports.generateProgramCompletionReport = async (req, res) => {
  try {
    const programId = req.params.id;
    const programDoc = await db.collection("programs").doc(programId).get();

    if (!programDoc.exists) {
      return res.status(404).json({ message: "Program not found." });
    }

    const programData = { id: programDoc.id, ...programDoc.data() };

    const participationsSnapshot = await db.collection("participations").where("programId", "==", programId).get();
    const completedParticipations = participationsSnapshot.docs.filter(doc => doc.data().status === "Completed");

    const programCompletionReport = {
      program: programData,
      totalParticipants: participationsSnapshot.docs.length,
      completedParticipants: completedParticipations.length,
      completionRate: (completedParticipations.length / participationsSnapshot.docs.length) * 100 || 0,
      // Placeholder for PDF/Excel generation logic
    };

    res.status(200).json({
      message: `Program completion report for program ID: ${programId}`,
      report: programCompletionReport,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating program completion report", error: error.message });
  }
};
