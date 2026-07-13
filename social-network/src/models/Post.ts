import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface IPost extends Document {
    user: Types.ObjectId;
    content: string;
    images: string[];   // đổi từ image → images
    likes: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPost>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: [true, "Nội dung không được để trống"], maxlength: [2000, "Nội dung không được vượt quá 2000 ký tự"], trim: true },
        images: { type: [String], default: [] },   // đổi từ image → images
        likes:{ type: [Schema.Types.ObjectId], ref: "User" },
    },
    {
        timestamps: true,
    }
);
const Post = models.Post || model<IPost>("Post", postSchema);

export default Post;