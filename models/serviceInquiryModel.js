const mongoose = require('mongoose');

const serviceInquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  service: {
    type: String,
    required: true,
    enum: ['Web Development', 'App Development', 'SEO Optimization', 'Fruits for Wedding']
  },
  budgetRange: {
    type: String,
    required: false
  },
  projectDetails: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const serviceInquiryModel = mongoose.model("serviceInquiry", serviceInquirySchema);

module.exports = serviceInquiryModel;
