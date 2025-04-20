const mongoose = require('mongoose');
const Configuration = require('../models/picks_configuration');
const logger = require('../utils/logger'); 

const createConfiguration = async (req, res) => {
  console.log('Request body:', req.body);
  console.log('User object:', req.user);

  if (!req.user?.userId) {
    return res.status(401).json({ error: 'User authentication missing' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { hardware, application, channels, totals, model, network, storage, partCode, teleportType } = req.body;

    const configData = {
      user: req.user.userId,
      hardware,
      application,
      channels,
      totals,
      model,
      network,
      partCode,
      teleportType,
      modelDetails: req.body.modelDetails
    };

    if (!(application === 'Teleport' && (teleportType === 'xport' || teleportType === 'inport'))) {
      configData.storage = storage;
    }

    const newConfiguration = new Configuration(configData);

    await newConfiguration.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      message: 'Configuration saved successfully',
      configuration: newConfiguration.toObject({ virtuals: true }),
      configId: newConfiguration._id // Explicitly include the ID
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to save configuration',
      details: error.message 
    });
  } finally {
    session.endSession();
  }
};

const getUserConfigurations = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User authentication missing' });
    }

    const configurations = await Configuration.find({ user: req.user.userId }).sort({ createdAt: -1 });

    const formattedConfigurations = configurations.map(config => ({
      ...config.toObject({ virtuals: true }),
    }));

    res.status(200).json(formattedConfigurations);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
};

const getConfigurationById = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User authentication missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid configuration ID' });
    }

    const configuration = await Configuration.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found or you do not have permission to view it' });
    }

    res.status(200).json({
      ...configuration.toObject({ virtuals: true }),
      createdAtIST: configuration.createdAtIST,
      updatedAtIST: configuration.updatedAtIST
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

const deleteConfiguration = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User authentication missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid configuration ID' });
    }

    const configuration = await Configuration.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!configuration) {
      return res.status(404).json({ 
        error: 'Configuration not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({ 
      error: 'Failed to delete configuration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Similarly update the updateConfiguration function
const updateConfiguration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User authentication missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid configuration ID' });
    }

    const { hardware, application, channels, totals, model, network, storage, partCode, teleportType } = req.body;

    if (!Array.isArray(channels)) {
      return res.status(400).json({ error: 'Channels must be an array' });
    }

    const updateData = {
      hardware,
      application,
      channels,
      totals,
      model,
      network,
      partCode,
      teleportType,
      updatedAt: new Date()
    };

    // Only include storage if not Xport or Inport
    if (!(application === 'Teleport' && (teleportType === 'xport' || teleportType === 'inport'))) {
      updateData.storage = storage;
    }

    const updatedConfig = await Configuration.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      updateData,
      { new: true, session, runValidators: true }
    );

    if (!updatedConfig) {
      return res.status(404).json({ 
        error: 'Configuration not found or you do not have permission to update it'
      });
    }

    await session.commitTransaction();
    res.status(200).json({
      message: 'Configuration updated successfully',
      configuration: updatedConfig.toObject({ virtuals: true })
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Update configuration error:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params,
      user: req.user
    });
    
    let errorMessage = 'Failed to update configuration';
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation failed: ' + Object.values(error.errors).map(e => e.message).join(', ');
    }

    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createConfiguration,
  getUserConfigurations,
  getConfigurationById,
  deleteConfiguration,
  updateConfiguration
};
