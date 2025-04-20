const express = require('express');
const PicksTable = require('../models/pickstable');
const router = express.Router();

// Fetch all entries
router.get('/', async (req, res) => {
  try {
    const entries = await PicksTable.find();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch an entry by ID
router.get('/:id', async (req, res) => {
  try {
    const entry = await PicksTable.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new entry
router.post('/', async (req, res) => {
  const {
    'Product Type': productType,
    RM,
    MEM,
    CPU,
    Model,
    Resolution,
    Bitrate,
    Framerate
  } = req.body;

  // Check if all fields are empty
  if (
    !productType &&
    !RM &&
    !MEM &&
    !CPU &&
    !Model &&
    !Resolution &&
    !Bitrate &&
    !Framerate
  ) {
    return res.status(400).json({ message: 'Please fill at least one field' });
  }

  try {
    const newEntry = new PicksTable({
      'Product Type': productType || '', // Default empty string if not provided
      RM: RM || '', // Default empty string if not provided
      MEM: MEM || '',
      CPU: CPU || '',
      Model: Model || '',
      Resolution: Resolution || '',
      Bitrate: Bitrate || '',
      Framerate: Framerate || ''
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an entry by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedEntry = await PicksTable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEntry) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an entry by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedEntry = await PicksTable.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
