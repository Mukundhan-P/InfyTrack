const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/student/:id", reportController.generateStudentReport);
router.get("/department/:name", reportController.generateDepartmentReport);
router.get("/program/:id", reportController.generateProgramCompletionReport);

module.exports = router;
