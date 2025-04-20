const mongoose = require('mongoose');

const resolutionInstanceSchema = new mongoose.Schema({
  bitrate: { type: Number, default: 1.5, min: 0 }, // Allow 0 as a valid bitrate
  framerate: { type: Number, default: 25 }, // Default framerate
  customFramerate: { type: Number }, // Custom framerate
  codec: { type: String, default: 'H264' },
});

const channelSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['HDMI', 'SDI', 'IP Inputs', 'SRT(PUSH/PULL)', 'RTMP', 'HLS', 'UDP', 'Fileout', 'RTSP', 'YoutubeLive', 'Playlist', 'SRT', 'ONVIF', 'NDI'],
  },
  secondaryType: {
    type: String,
    enum: ['HDMI', 'SDI', 'IP Inputs', 'SRT(PUSH/PULL)', 'RTMP', 'HLS', 'UDP', 'Fileout', 'RTSP', 'YoutubeLive', 'Playlist', 'SRT', 'ONVIF', 'NDI'],
  },
  ipType: {
    type: String,
    enum: ['SRT(PUSH/PULL)', 'RTMP', 'HLS', 'UDP', 'Fileout', 'RTSP', 'YoutubeLive', 'Playlist', 'SRT', 'ONVIF', 'NDI', 'RTP'],
  },
  resolution: {
    SD: [resolutionInstanceSchema],
    HD: [resolutionInstanceSchema],
    FHD: [resolutionInstanceSchema],
    UHD: [resolutionInstanceSchema],
  },
  protocols: {
    type: Map,
    of: String,
  },
  rm: {
    type: Number,
    required: true,
  },
  memory: {
    type: Number,
    required: true,
  },
  
  cpu: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
    enum: [
      '4:2:0-I420',
      '4:2:2-Y42B',
      '4:2:2-UYVY',
      '4:2:2-YUY2',
      '4:2:2-RGB',
      '4:2:2-10LE',
      '4:4:4-10LE',
      '4:4:4-Alpha',
    ],
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to set default bitrates and framerates based on resolution type
channelSchema.pre('save', function (next) {
  const resolutions = ['SD', 'HD', 'FHD', 'UHD'];
  const defaultBitrates = {
    SD: 1.5, // Default bitrate for SD
    HD: 4,   // Default bitrate for HD
    FHD: 6,  // Default bitrate for FHD
    UHD: 12, // Default bitrate for UHD
  };

  resolutions.forEach((res) => {
    if (this.resolution[res] && this.resolution[res].length > 0) {
      this.resolution[res].forEach((instance) => {
        // Set default bitrate if not provided
        if (!instance.bitrate) {
          instance.bitrate = defaultBitrates[res];
        }
      });
    }
  });

    next();
  });

const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel;