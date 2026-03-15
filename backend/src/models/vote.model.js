import mongoose from 'mongoose';

//đề cử
const voteSchema = new mongoose.Schema(
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
  },
  { timestamps: true, collection: 'votes' }
);

//không cho 1 user vote 2 lần 1 truyện
voteSchema.index({ user: 1, book: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);
