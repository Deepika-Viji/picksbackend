const express = require('express');
const router = express.Router();
const PicksHardware = require('../models/picks_hardware');  // Assuming the correct model path

// Route to get hardware data
router.get('/', async (req, res) => {
  try {
    const hardwareData = await PicksHardware.find();  // Fetch data from MongoDB
    res.json(hardwareData);  // Send the data to the client
  } catch (error) {
    console.error('Error fetching hardware data:', error);
    res.status(500).json({ message: 'Error fetching hardware data' });
  }
});

// Route to create a new hardware segment
router.post('/', async (req, res) => {
  const { name, products } = req.body;

  try {
    const newSegment = new PicksHardware({
      name,
      products,
    });

    await newSegment.save();  // Save the new segment to MongoDB
    res.status(201).json(newSegment);  // Return the newly created segment
  } catch (error) {
    console.error('Error creating hardware segment:', error);
    res.status(500).json({ message: 'Error creating hardware segment' });
  }
});

// Route to update hardware data by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, products } = req.body;

  try {
    // Find the hardware segment by ID and update it
    const updatedSegment = await PicksHardware.findByIdAndUpdate(
      id,
      { name, products },
      { new: true }  // Return the updated document
    );

    if (!updatedSegment) {
      return res.status(404).json({ message: 'Hardware segment not found' });
    }

    // Return the updated segment
    res.json(updatedSegment);
  } catch (error) {
    console.error('Error updating hardware segment:', error);
    res.status(500).json({ message: 'Error updating hardware segment' });
  }
});

// Route to delete hardware segment by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the hardware segment by ID and delete it
    const deletedSegment = await PicksHardware.findByIdAndDelete(id);

    if (!deletedSegment) {
      return res.status(404).json({ message: 'Hardware segment not found' });
    }

    // Return a success message
    res.json({ message: 'Hardware segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting hardware segment:', error);
    res.status(500).json({ message: 'Error deleting hardware segment' });
  }
});


module.exports = router;
