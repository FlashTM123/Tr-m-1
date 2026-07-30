// src/models/Story.ts
import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface IStory extends Document {
  user:      Types.ObjectId;
  mediaUrl:  string;
  mediaType: "image" | "video";
  caption:   string;
  viewers:   Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    user:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl:  { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    caption:   { type: String, default: "", maxlength: 200 },
    viewers:   [{ type: Schema.Types.ObjectId, ref: "User" }],
    expiresAt: {
      type:    Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 giờ
      index:   true, // index để query nhanh theo expiresAt
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB tự động xóa document khi expiresAt qua
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = models.Story || model<IStory>("Story", StorySchema);
export default Story;
