const express = require("express");
const router = express.Router();
const statusController = require("../controllers/statusController");

router.get("/:studentId/:programId", statusController.getParticipationStatus);
router.put("/:participationId", statusController.updateParticipationStatus);

module.exports = router;
