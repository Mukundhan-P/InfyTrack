const { db } = require("../firebase");

exports.getAnalytics = async (req, res) => {
  try {
    const totalStudentsSnapshot = await db.collection("students").count().get();
    const totalStudents = totalStudentsSnapshot.data().count;

    const completedInternshipsSnapshot = await db.collection("participations").where("status", "==", "Completed").count().get();
    const completedInternships = completedInternshipsSnapshot.data().count;

    res.status(200).json({
      totalStudents,
      completedInternships,
      message: "Overall analytics data from Firestore"
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics data", error: error.message });
  }
};

exports.getDepartmentStats = async (req, res) => {
  try {
    const studentsSnapshot = await db.collection("students").get();
    const departmentStats = {};

    studentsSnapshot.forEach(doc => {
      const student = doc.data();
      if (student.department) {
        departmentStats[student.department] = (departmentStats[student.department] || 0) + 1;
      }
    });

    res.status(200).json({
      departmentStats,
      message: "Department-wise statistics from Firestore"
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching department statistics", error: error.message });
  }
};
