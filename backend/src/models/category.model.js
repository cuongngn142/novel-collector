import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    slug: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true, collection: 'categories' }
);

export default mongoose.model('Category', categorySchema);
