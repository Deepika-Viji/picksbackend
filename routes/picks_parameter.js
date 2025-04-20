const express = require('express');
const router = express.Router();
const PicksParameters = require('../models/picks_parameter');

// Get all picks parameters
router.get('/', async (req, res) => {
  try {
    const picksParameters = await PicksParameters.find(); // Fetch all documents
    res.json(picksParameters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching picksparameters data.' });
  }
});

// Get a specific picks parameter by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;  // Get the parameter ID from the URL
    const picksParameter = await PicksParameters.findById(id);  // Find the document by ID

    if (!picksParameter) {
      return res.status(404).json({ message: 'Parameter not found.' });
    }

    res.json(picksParameter);  // Send the parameter data as JSON
  } catch (error) {
    console.error('Error fetching parameter by ID:', error);
    res.status(500).json({ message: 'Error fetching parameter data.' });
  }
});

// Update a specific picks parameter by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get the parameter ID from the URL
    const updatedData = req.body; // Get the updated data from the request body

    // Ensure the data exists
    if (!updatedData || !updatedData.Frontend || !updatedData.Backend) {
      return res.status(400).json({ message: 'Invalid data. Both Frontend and Backend are required.' });
    }

    // Update the parameter with the new data
    const picksParameter = await PicksParameters.findByIdAndUpdate(id, updatedData, {
      new: true,  // Return the updated document
    });

    if (!picksParameter) {
      return res.status(404).json({ message: 'Parameter not found.' });
    }

    res.json(picksParameter);  // Return the updated parameter data
  } catch (error) {
    console.error('Error updating parameter:', error);
    res.status(500).json({ message: 'Error updating parameter.' });
  }
});

// Bulk update picks parameters
router.put('/', async (req, res) => {
  try {
    const { formData } = req.body;  // Expecting formData in the request body

    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ message: 'Invalid form data.' });
    }

    // Create bulk update operations
    const bulkOps = Object.entries(formData).map(([id, backendValue]) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { Backend: backendValue } } // Use uppercase 'Backend'
      }
    }));

    // Execute bulk write
    await PicksParameters.bulkWrite(bulkOps);

    res.status(200).json({ message: 'Parameters updated successfully!' });
  } catch (error) {
    console.error('Error updating parameters:', error);
    res.status(500).json({ message: 'Error updating parameters.' });
  }
});

module.exports = router;
