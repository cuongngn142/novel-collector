import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
    title: String,
    index: Number,
    content: String,
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: 'chapters' }
);

export default mongoose.model('Chapter', chapterSchema);
