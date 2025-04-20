const PicksTable = require('../models/pickstable');
const PicksModel = require('../models/picks_model');

// Helper function to parse memory from strings like '16 GB'
const parseMemory = (memory) => {
  if (!memory) return 0;
  const memoryStr = memory.toString();
  const parsedMemory = parseFloat(memoryStr.replace(/[^\d.-]/g, ''));
  if (isNaN(parsedMemory)) {
    console.warn(`Unable to parse memory: ${memory}`);
  }
  return parsedMemory || 0;
};

// Improved function to calculate total memory
const calculateTotalMemory = (memory) => {
  const memoryInGB = memory / 1024; // Converting to GB
  let roundedMemory = Math.ceil(memoryInGB / 16) * 16; // Rounding to nearest multiple of 16

  const numOfSticks = roundedMemory / 16;
  if (numOfSticks % 2 !== 0) {
    roundedMemory += 16; // Ensure an even number of RAM sticks
  }

  return { originalMemory: memoryInGB, roundedMemory };
};

const calculate = async (req, res) => {
  const { sd, hd, fhd, uhd, passthrough, decoder, protocols = [] } = req.body;

  try {
    // Fetch all required encoders in a single query
    const encodersData = await PicksTable.find({ 
      'Product Type': { 
        $in: ['Encoder-SD', 'Encoder-HD', 'Encoder-FHD', 'Encoder-4k', 'Passthrough', 'Decoder'] 
      } 
    });

    // Extract encoder data for each type
    const sdData = encodersData.find(encoder => encoder['Product Type'] === 'Encoder-SD') || {};
    const hdData = encodersData.find(encoder => encoder['Product Type'] === 'Encoder-HD') || {};
    const fhdData = encodersData.find(encoder => encoder['Product Type'] === 'Encoder-FHD') || {};
    const uhdData = encodersData.find(encoder => encoder['Product Type'] === 'Encoder-4k') || {};
    const passthroughData = encodersData.find(encoder => encoder['Product Type'] === 'Passthrough') || {};
    const decoderData = encodersData.find(encoder => encoder['Product Type'] === 'Decoder') || {};

    // Extract RM, Memory (MEM), and CPU values, defaulting to 0 if not found
    const sdRM = sdData.RM || 0;
    const hdRM = hdData.RM || 0;
    const fhdRM = fhdData.RM || 0;
    const uhdRM = uhdData.RM || 0;
    const passthroughRM = passthroughData.RM || 0;
    const decoderRM = decoderData.RM || 0;

    const sdMemory = parseMemory(sdData.MEM || 0);
    const hdMemory = parseMemory(hdData.MEM || 0);
    const fhdMemory = parseMemory(fhdData.MEM || 0);
    const uhdMemory = parseMemory(uhdData.MEM || 0);
    const passthroughMemory = parseMemory(passthroughData.MEM || 0);
    const decoderMemory = parseMemory(decoderData.MEM || 0);

    const sdCPU = sdData.CPU || 0;
    const hdCPU = hdData.CPU || 0;
    const fhdCPU = fhdData.CPU || 0;
    const uhdCPU = uhdData.CPU || 0;
    const passthroughCPU = passthroughData.CPU || 0;
    const decoderCPU = decoderData.CPU || 0;

    // Perform the calculations
    // Changed passthrough and decoder to multiply by their counts
    let totalRM = (sd * sdRM) + (hd * hdRM) + (fhd * fhdRM) + (uhd * uhdRM) + 
                 (passthrough * passthroughRM) + (decoder * decoderRM);
    totalRM = totalRM * 1.43;

    // Calculate RM addition based on protocols
    const totalProtocols = protocols.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    let rmAddition = 0;

    if (totalProtocols >= 4 && totalProtocols <= 6) {
      rmAddition = 500;
    } else if (totalProtocols >= 7 && totalProtocols <= 9) {
      rmAddition = 1000;
    }

    totalRM += rmAddition;

    let totalMemory = (sdMemory * sd) + (hdMemory * hd) + (fhdMemory * fhd) + (uhdMemory * uhd) +
                     (passthrough * passthroughMemory) + (decoder * decoderMemory);
    const memoryResults = calculateTotalMemory(totalMemory * 2); // Doubling memory

    let totalCPU = (sd * sdCPU) + (hd * hdCPU) + (fhd * fhdCPU) + (uhd * uhdCPU) +
                  (passthrough * passthroughCPU) + (decoder * decoderCPU);
    totalCPU = totalCPU * 1.5;

    // Rest of your code remains the same...
    // Fetch model based on totalRM
    const modelData = await PicksModel.findOne({ pm: totalRM });

    let modelInfo = {
      modelName: 'No matching model found',
      pm: null,
      maxSupport: null,
      ip: null,
      pci: null,
      u1: null,
      u2: null
    };

    if (modelData) {
      modelInfo = {
        modelName: modelData.model || 'No model field found',
        pm: modelData.pm || 'No pm field found',
        maxSupport: modelData.max_support || 'No max_support field found',
        ip: modelData.ip || 'No ip field found',
        pci: modelData.pci || 'No pci field found',
        u1: modelData['1u'] || 'No 1u field found',
        u2: modelData['2u'] || 'No 2u field found'
      };
    }

    // Respond with the calculation result
    res.json({
      totalRM: totalRM.toFixed(2),
      totalMemoryBeforeRounding: memoryResults.originalMemory.toFixed(2),
      totalMemoryAfterRounding: memoryResults.roundedMemory.toFixed(2),
      totalCPU: totalCPU.toFixed(2),
      modelInfo
    });

  } catch (error) {
    console.error('Error performing calculation:', error);
    res.status(500).json({ error: 'An error occurred during the calculation. Please try again later.' });
  }
};

module.exports = calculate;
