const express = require('express');
const PicksModel = require('../models/picks_model');
const router = express.Router();

// New route to get the closest model based on RM (pm)
router.get('/closest', async (req, res) => {
  try {
    const { totalRM } = req.query;
    const numericTotalRM = parseFloat(totalRM);

    // First find the closest non-G4 model
    const closestNonG4Model = await PicksModel.aggregate([
      {
        $match: {
          model: { $not: { $regex: /G4$/i } }
        }
      },
      {
        $addFields: {
          numericPM: { $toDouble: "$pm" }
        }
      },
      {
        $match: {
          numericPM: { $gte: numericTotalRM }
        }
      },
      { $sort: { numericPM: 1 } },
      { $limit: 1 }
    ]);

    if (closestNonG4Model.length === 0) {
      return res.status(404).json({ error: 'No suitable model found' });
    }

    const baseModel = closestNonG4Model[0];
    
    // Then find the closest G4 model (if needed)
    let g4Model = null;
    if (numericTotalRM > 40000) {
      g4Model = await PicksModel.aggregate([
        {
          $match: {
            model: { $regex: /G4$/i }
          }
        },
        {
          $addFields: {
            numericPM: { 
              $cond: {
                if: { $eq: [{ $type: "$pm" }, "string"] },
                then: { $toDouble: "$pm" },
                else: "$pm"
              }
            },
            numericG4PM: {
              $cond: {
                if: { $eq: [{ $type: "$g4_pm" }, "string"] },
                then: { $toDouble: "$g4_pm" },
                else: "$g4_pm"
              }
            }
          }
        },
        {
          $match: {
            $or: [
              { numericPM: { $gte: numericTotalRM } },
              { numericG4PM: { $gte: numericTotalRM } }
            ]
          }
        },
        { $sort: { numericPM: 1 } },
        { $limit: 1 }
      ]);
    }

    return res.status(200).json({
      model: {
        model: baseModel.model,
        pm: baseModel.pm,
        pci: baseModel.pci,
        g4Model: g4Model && g4Model.length > 0 ? g4Model[0].model : null,
        g4PM: g4Model && g4Model.length > 0 ? 
          (g4Model[0].g4_pm || g4Model[0].pm) : 
          null
      }
    });

  } catch (err) {
    console.error('Error in /closest:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

// Fetch all models
router.get('/', async (req, res) => {
  try {
    const models = await PicksModel.find();
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch a model by ID
router.get('/:id', async (req, res) => {
  try {
    const model = await PicksModel.findById(req.params.id);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.json(model);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new model
router.post('/', async (req, res) => {
  const {
    model,
    pm,
    max_support,  // Matching the model schema
    ip,           // Matching the model schema
    pci,          // Matching the model schema
    '1u': oneU,   // Using lowercase '1u'
    '2u': twoU    // Using lowercase '2u'
  } = req.body;

  try {
    const newModel = new PicksModel({
      model,
      pm,
      max_support,
      ip,
      pci,
      '1u': oneU,   // Using lowercase '1u' in MongoDB
      '2u': twoU    // Using lowercase '2u' in MongoDB
    });
    await newModel.save();
    res.status(201).json(newModel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a model by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedModel = await PicksModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedModel) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.json(updatedModel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a model by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedModel = await PicksModel.findByIdAndDelete(req.params.id);
    if (!deletedModel) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
