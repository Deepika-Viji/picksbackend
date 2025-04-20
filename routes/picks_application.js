const express = require('express');
const router = express.Router();
const PicksApplication = require('../models/picks_application');  // Assuming the correct model path

// Route to get application data
router.get('/', async (req, res) => {
  try {
    const applicationData = await PicksApplication.find();  // Fetch data from MongoDB
    res.json(applicationData);  // Send the data to the client
  } catch (error) {
    console.error('Error fetching application data:', error);
    res.status(500).json({ message: 'Error fetching application data' });
  }
});

// Route to create a new application segment
router.post('/', async (req, res) => {
  const { name, products } = req.body;

  try {
    const newSegment = new PicksApplication({
      name,
      products,
    });

    await newSegment.save();  // Save the new segment to MongoDB
    res.status(201).json(newSegment);  // Return the newly created segment
  } catch (error) {
    console.error('Error creating application segment:', error);
    res.status(500).json({ message: 'Error creating application segment' });
  }
});

// Route to update an application segment by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, products } = req.body;

  try {
    // Find the application segment by ID and update it
    const updatedSegment = await PicksApplication.findByIdAndUpdate(
      id,
      { name, products },
      { new: true }
    );

    if (!updatedSegment) {
      return res.status(404).json({ message: 'Application segment not found' });
    }

    // Return the updated segment
    res.json(updatedSegment);
  } catch (error) {
    console.error('Error updating application segment:', error);
    res.status(500).json({ message: 'Error updating application segment' });
  }
});

// Route to delete application segment by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the application segment by ID and delete it
    const deletedSegment = await PicksApplication.findByIdAndDelete(id);

    if (!deletedSegment) {
      return res.status(404).json({ message: 'Application segment not found' });
    }

    // Return a success message
    res.json({ message: 'Application segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting application segment:', error);
    res.status(500).json({ message: 'Error deleting application segment' });
  }
});


module.exports = router;
