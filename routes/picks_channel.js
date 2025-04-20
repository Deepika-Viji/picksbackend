const express = require('express');
const { getAllChannels, createChannel, updateChannel } = require('../controllers/channelController'); // Import the new updateChannel function
const router = express.Router();

// Route to get all channels
router.get('/', getAllChannels);

// Route to create a new channel
router.post('/', createChannel);

// Route to update a channel by ID
router.put('/:id', updateChannel); // Add this route for updating a channel

module.exports = router;