const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const donorRoutes = require('./donorRoutes');
const patientRoutes = require('./patientRoutes');
const matchRoutes = require('./matchRoutes');
const excelRoutes = require('./excelRoutes');
const predictionRoutes = require('./predictionRoutes');
const emergencyRequestRoutes = require('./emergencyRequestRoutes');
const requestRoutes = require('./requestRoutes');

router.use(authRoutes);
router.use(donorRoutes);
router.use(patientRoutes);
router.use(matchRoutes);
router.use(excelRoutes);
router.use(predictionRoutes);
router.use(requestRoutes);
router.use(emergencyRequestRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

module.exports = router;
