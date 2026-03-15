import mongoose from 'mongoose';

const bookTagSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },

    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
      required: true,
    },
  },
  { timestamps: true, collection: 'book_tags' }
);

bookTagSchema.index({ book: 1, tag: 1 }, { unique: true });

export default mongoose.model('BookTag', bookTagSchema);
