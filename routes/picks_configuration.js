const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { 
  createConfiguration,
  getUserConfigurations,
  getConfigurationById,
  deleteConfiguration,
  updateConfiguration
} = require('../controllers/configurationController');

const validateConfiguration = [
  body('hardware').notEmpty().withMessage('Hardware selection is required'),
  body('application').notEmpty().withMessage('Application selection is required'),
  body('channels').isArray({ min: 1 }).withMessage('At least one channel is required'),
  body('totals.rm').isNumeric().withMessage('RM must be a number'),
  body('totals.memory').isNumeric().withMessage('Memory must be a number'),
  body('totals.cpu').isNumeric().withMessage('CPU must be a number'),
  body('network.ports').isInt().withMessage('Ports must be an integer'),
  body('network.throughput').isInt().withMessage('Throughput must be an integer'),
  body('partCode').notEmpty().withMessage('Part code is required'),
  (req, res, next) => {
    // Skip storage validation for Teleport Xport or Inport
    if (req.body.application === 'Teleport' && 
        (req.body.teleportType === 'xport' || req.body.teleportType === 'inport')) {
      return next();
    }
    
    // For all other cases, validate storage
    body('storage.type').isIn(['HDD', 'SSD']).withMessage('Invalid storage type').run(req);
    body('storage.capacity').notEmpty().withMessage('Storage capacity is required').run(req);
    
    next();
  }
];

router.post('/', 
  authMiddleware,
  validateConfiguration,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    createConfiguration(req, res, next);
  }
);

router.get('/user', authMiddleware, getUserConfigurations);
router.get('/:id', authMiddleware, getConfigurationById);
router.delete('/:id', authMiddleware, deleteConfiguration);
router.put('/:id', authMiddleware, validateConfiguration, updateConfiguration);

module.exports = router;