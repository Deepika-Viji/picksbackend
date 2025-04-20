// routes/calculate.js
const express = require('express');
const router = express.Router();
const calculate = require('../controllers/calculateController'); // Ensure this path is correct

// POST route to perform the calculation
router.post('/', calculate);  // Ensure the `calculate` function is passed correctly

module.exports = router;
