// src/models/Comment.ts

import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface IComment extends Document {
    post: Types.ObjectId; // ID của bài viết mà comment thuộc về
    user: Types.ObjectId; // ID của người dùng đã comment
    content: string;      // Nội dung comment
    createdAt: Date;      // Thời gian tạo comment
    updatedAt: Date;      // Thời gian cập nhật comment
}

const commentSchema = new Schema<IComment>(
    {
        post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: [true, "Nội dung comment là bắt buộc"], maxlength: [500, "Nội dung comment không được vượt quá 500 ký tự"], trim: true },
        
    },
    { timestamps: true }
);

const Comment = models.Comment || model<IComment>("Comment", commentSchema);

export default Comment;