import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },

    score: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
  },
  { timestamps: true, collection: 'ratings' }
);

ratingSchema.index({ user: 1, book: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);
