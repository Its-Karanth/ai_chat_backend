import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  }
});

// Create indexes for better query performance
chatMessageSchema.index({ timestamp: -1 });
chatMessageSchema.index({ sessionId: 1, timestamp: -1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema); 