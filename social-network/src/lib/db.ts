// src/lib/db.ts
// Pattern: Mongoose Singleton Connection
// Mục đích: Tái sử dụng connection đã có thay vì tạo mới mỗi lần
// hot-reload trong dev mode, tránh tràn connection pool.

import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Vui lòng định nghĩa biến MONGODB_URI trong file .env.local"
  );
}

/**
 * Lưu trữ connection vào global object để survive qua hot-reload của Next.js.
 * Trong môi trường production, module được cache tự nhiên nên không cần global.
 */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Khai báo kiểu cho global để TypeScript không báo lỗi
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

// Gán lại vào global để hot-reload không tạo connection mới
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<Mongoose> {
  // Nếu đã có connection sẵn, dùng lại luôn
  if (cached.conn) {
    return cached.conn;
  }

  // Nếu chưa có promise đang chạy, tạo mới
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Không buffer lệnh khi chưa kết nối — phát hiện lỗi sớm hơn
      family: 4,             // Ép dùng IPv4 — fix lỗi ECONNREFUSED khi Node.js resolve SRV qua IPv6 trên Windows
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset promise nếu kết nối thất bại để lần sau có thể thử lại
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
