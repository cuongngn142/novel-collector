import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
    content: String,
  },
  { timestamps: true, collection: 'comments' }
);

export default mongoose.model('Comment', commentSchema);
