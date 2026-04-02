const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");

router.post("/", programController.addProgram);
router.get("/", programController.getAllPrograms);
router.put("/:id", programController.updateProgram);
router.delete("/:id", programController.deleteProgram);

module.exports = router;
