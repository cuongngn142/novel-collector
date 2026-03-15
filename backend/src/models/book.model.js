import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: String,
    author: String,
    description: String,
    cover: String,

    status: {
      type: String,
      enum: ['Chưa hoàn thành', 'Đã hoàn thành', 'Tạm dừng'],
      default: 'Chưa hoàn thành',
    },

    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    views: {
      type: Number,
      default: 0,
    },

    favoritesCount: {
      type: Number,
      default: 0,
    },

    votesCount: {
      type: Number,
      default: 0,
    },

    ratingAverage: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },

    chaptersCount: {
      type: Number,
      default: 0,
    },

    wordsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: 'books' }
);

export default mongoose.model('Book', bookSchema);
