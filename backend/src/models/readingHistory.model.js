import mongoose from 'mongoose';

const readingHistorySchema = new mongoose.Schema(
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

    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
    },

    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, collection: 'reading_history' }
);

readingHistorySchema.index({ user: 1, book: 1 });

export default mongoose.model('ReadingHistory', readingHistorySchema);
