import mongoose from 'mongoose';

const bookCategorySchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true, collection: 'book_categories' }
);

bookCategorySchema.index({ book: 1, category: 1 }, { unique: true });

export default mongoose.model('BookCategory', bookCategorySchema);
