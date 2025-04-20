const Channel = require('../models/picks_channel');

// Get all channels
const getAllChannels = async (req, res) => {
  try {
    const channels = await Channel.find();
    res.status(200).json({ channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
};

// Create a new channel
const createChannel = async (req, res) => {
  try {
    const { type, secondaryType, ipType, resolution, protocols, rm, memory, cpu, format, muxerValues, slicingValues, slicingInputValues } = req.body;

    const newChannel = new Channel({
      type,
      secondaryType,
      ipType,
      resolution,
      protocols,
      rm,
      memory,
      cpu,
      format,
      muxerValues,
      slicingValues,
      slicingInputValues,
    });

    await newChannel.save();
    res.status(201).json({ message: 'Channel created successfully', channel: newChannel });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
};

const updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, secondaryType, ipType, resolution, protocols, rm, memory, cpu, format, muxerValues, slicingValues, slicingInputValues } = req.body;

    const updatedChannel = await Channel.findByIdAndUpdate(
      id,
      {
        type,
        secondaryType,
        ipType,
        resolution,
        protocols,
        rm,
        memory,
        cpu,
        format,
        muxerValues,
        slicingValues,
        slicingInputValues,
      },
      { new: true }
    );

    if (!updatedChannel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.status(200).json({ message: 'Channel updated successfully', channel: updatedChannel });
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
};

module.exports = { getAllChannels, createChannel, updateChannel }; // Export the new updateChannel function