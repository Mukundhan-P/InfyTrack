const express = require("express");
const router = express.Router();
const participationController = require("../controllers/participationController");

router.post("/submit", participationController.submitParticipation);
router.get("/:studentId", participationController.getStudentParticipation);

module.exports = router;
