const mongoose = require('mongoose');

const PixelSchema = new mongoose.Schema(
  {
    pixelCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'Untitled Pixel' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    totalHits: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pixel', PixelSchema);
