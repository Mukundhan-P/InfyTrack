const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, requireStudent } = require('../middleware/auth');

router.get('/profile', verifyToken, requireStudent, studentController.getStudentProfile);
router.put('/profile', verifyToken, requireStudent, studentController.updateStudentProfile);
router.post('/participation', verifyToken, requireStudent, studentController.submitParticipation);
router.get('/participation', verifyToken, requireStudent, studentController.getMyParticipations);
router.put('/participation/:id', verifyToken, requireStudent, studentController.updateParticipation);

module.exports = router;
