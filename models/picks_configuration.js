const mongoose = require('mongoose');

const storageSchema = new mongoose.Schema({
  type: { type: String, enum: ['HDD', 'SSD'] },
  capacity: { type: String }
});

const networkSchema = new mongoose.Schema({
  ports: { type: Number },
  throughput: { type: Number }
});

const totalsSchema = new mongoose.Schema({
  rm: { type: Number },
  memory: { type: Number },
  cpu: { type: Number }
});

const channelSchema = new mongoose.Schema({
  type: String,
  ipType: String,
  secondaryType: String,
  secondaryIpType: String,
  resolution: Object,
  protocols: Object,
  rm: Number,
  memory: String,
  cpu: String,
  format: String,
  muxerValues: Object,
  slicingValues: Object,
  slicingInputValues: Object,
});

const modelDetailsSchema = new mongoose.Schema({
  name: String,
  g4Model: String,
  pm: Number,
  g4Pm: Number,
  pci: String
});

const configurationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hardware: { type: String, required: true },
  application: { type: String, required: true },
  model: { type: String },
  partCode: { type: String },
  channels: [channelSchema], 
  modelDetails: modelDetailsSchema,
  totals: totalsSchema,
  network: networkSchema,
  storage: storageSchema,
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true, 
    transform: (_, ret) => { 
      ret.createdAtIST = new Date(ret.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      ret.updatedAtIST = new Date(ret.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      return ret;
    } 
  },
  toObject: { virtuals: true }
});

// Virtual fields
configurationSchema.virtual('createdAtIST').get(function () {
  return this.createdAt 
    ? new Date(this.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
    : null;
});

configurationSchema.virtual('updatedAtIST').get(function () {
  return this.updatedAt 
    ? new Date(this.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
    : null;
});

const Configuration = mongoose.model('Configuration', configurationSchema);
module.exports = Configuration;
