const mongoose = require('mongoose');

const brandVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  duration: {
    type: String, // e.g., "00:30", "01:45"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'Brand'
  }
}, {
  timestamps: true
});

const BrandVideo = mongoose.model('BrandVideo', brandVideoSchema);

module.exports = BrandVideo;
