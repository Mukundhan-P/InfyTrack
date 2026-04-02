const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

router.get("/students", searchController.searchStudents);

module.exports = router;
