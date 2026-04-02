require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/verification', require('./routes/verificationRoutes'));

app.get('/', (req, res) => res.send('Infosys Student Tracker Backend is running!'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
