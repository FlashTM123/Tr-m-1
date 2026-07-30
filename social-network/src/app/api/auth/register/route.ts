// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// Next.js App Router: export function tên "POST" = xử lý HTTP POST request
export async function POST(req: NextRequest) {
    try {
        // ── BƯỚC 1: Kết nối database ──────────────────────────────
        // Gọi connectDB() — nhờ Singleton Pattern, sẽ tái dùng connection cũ
        // nếu đã có, không tạo mới mỗi request.
        await connectDB();

        // ── BƯỚC 2: Lấy dữ liệu từ request body ──────────────────
        const body = await req.json();
        const { username, email, password } = body;

        // ── BƯỚC 3: Validate — kiểm tra dữ liệu đầu vào ──────────
        // Nếu bất kỳ trường nào trống → trả về lỗi 400 (Bad Request)
        if (!username || !email || !password) {
            return NextResponse.json(
                { message: "Vui lòng điền đầy đủ username, email và password" },
                { status: 400 }
            );
        }

        // ── BƯỚC 4: Kiểm tra trùng lặp trong DB ──────────────────
        // Dùng toán tử $or: tìm document có username OR email trùng.
        // toLowerCase() đảm bảo so sánh không phân biệt hoa/thường.
        const existingUser = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: email.toLowerCase() },
            ],
        });

        if (existingUser) {
            // Phân biệt lỗi cụ thể để frontend hiển thị đúng thông báo
            const message =
                existingUser.username === username.toLowerCase()
                    ? "Username này đã được sử dụng"
                    : "Email này đã được đăng ký";

            return NextResponse.json({ message }, { status: 409 }); // 409 Conflict
        }

        // ── BƯỚC 5: Mã hóa password ───────────────────────────────
        // saltRounds = 12: càng cao càng an toàn nhưng càng chậm.
        // 10-12 là chuẩn production. TUYỆT ĐỐI không lưu plain-text password.
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // ── BƯỚC 6: Tạo và lưu User mới vào DB ───────────────────
        const newUser = await User.create({
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword, // Lưu password đã hash, KHÔNG phải gốc
            avatar: "",
            followers: [],
            following: [],
        });

        // ── BƯỚC 7: Trả về response thành công ───────────────────
        // Dùng destructuring để loại bỏ password khỏi response.
        // KHÔNG BAO GIỜ trả password (dù đã hash) về cho client.
        const { password: _password, ...userWithoutPassword } = newUser.toObject();

        return NextResponse.json(
            {
                message: "Đăng ký thành công!",
                user: userWithoutPassword,
            },
            { status: 201 } // 201 Created — đúng chuẩn REST cho tạo mới resource
        );
    } catch (error) {
        // Log lỗi ở server để debug, không lộ chi tiết lỗi ra client
        console.error("[REGISTER_ERROR]", error);

        return NextResponse.json(
            { message: "Lỗi máy chủ, vui lòng thử lại sau" },
            { status: 500 }
        );
    }
}
