# 🌐 Social Network

Dự án Mạng xã hội full-stack được xây dựng trên nền tảng **Next.js 15 App Router**, sử dụng hệ sinh thái công nghệ hiện đại, production-ready.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + [Shadcn/ui](https://ui.shadcn.com) (Nova theme) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com) |
| **Auth** | [Auth.js v5](https://authjs.dev) (GitHub OAuth, Google OAuth) |
| **Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) |
| **Global State** | [Zustand](https://zustand-demo.pmnd.rs) |
| **File Upload** | [Uploadthing](https://uploadthing.com) |
| **Password Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |

---

## 📁 Cấu trúc dự án

```
social-network/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # Auth.js handler
│   │   │   │   └── register/route.ts       # Register API
│   │   │   └── uploadthing/route.ts        # Uploadthing handler
│   │   ├── globals.css
│   │   ├── layout.tsx                      # Root layout (Server Component)
│   │   └── page.tsx
│   ├── auth.ts                             # Auth.js config
│   ├── components/
│   │   ├── providers.tsx                   # SessionProvider + QueryClientProvider
│   │   └── ui/                             # Shadcn/ui components
│   ├── lib/
│   │   ├── db.ts                           # Mongoose Singleton connection
│   │   ├── query-client.ts                 # TanStack Query client
│   │   └── utils.ts
│   ├── models/
│   │   └── User.ts                         # User Schema & Model
│   └── store/
│       └── ui-store.ts                     # Zustand global state
├── .env.example                            # Template biến môi trường
├── .env.local                              # Biến môi trường (không commit)
├── components.json                         # Shadcn config
└── tsconfig.json
```

---

## ⚙️ Cài đặt & Chạy local

### Yêu cầu

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)
- Tài khoản [MongoDB Atlas](https://cloud.mongodb.com)
- Tài khoản [Uploadthing](https://uploadthing.com)
- GitHub OAuth App

### 1. Clone dự án

```bash
git clone https://github.com/your-username/social-network.git
cd social-network
```

### 2. Cài dependencies

```bash
pnpm install
```

### 3. Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Điền các giá trị vào `.env.local`:

```env
# Database (MongoDB Atlas)
MONGODB_URI=your_mongodb_connection_string

# Auth.js
AUTH_SECRET=your_auth_secret
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000

# Uploadthing
UPLOADTHING_TOKEN=your_uploadthing_token

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Tạo `AUTH_SECRET` bằng lệnh: `pnpm dlx auth secret`

### 4. Chạy dev server

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới | ❌ |
| `GET/POST` | `/api/auth/[...nextauth]` | Auth.js handler | - |

#### `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "minhdz",
  "email": "minh@example.com",
  "password": "123456"
}
```

**Response 201:**
```json
{
  "message": "Đăng ký thành công!",
  "user": {
    "_id": "...",
    "username": "minhdz",
    "email": "minh@example.com",
    "avatar": "",
    "followers": [],
    "following": [],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 🔑 Tạo OAuth Apps

### GitHub OAuth
1. [GitHub Developer Settings](https://github.com/settings/developers) → **New OAuth App**
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3000/api/auth/callback/github`

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create Credentials → OAuth Client ID**
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

---

## 📜 Scripts

```bash
pnpm dev        # Chạy dev server (Turbopack)
pnpm build      # Build production
pnpm start      # Chạy production server
pnpm lint       # Kiểm tra ESLint
```

---

## 🌱 Roadmap

### ✅ Hoàn thành
- [x] Setup dự án Next.js 15 (App Router, TypeScript, Tailwind)
- [x] Kết nối MongoDB Atlas (Mongoose Singleton Pattern)
- [x] Cấu hình Auth.js v5 (GitHub + Google OAuth)
- [x] Setup Shadcn/ui, TanStack Query, Zustand, Uploadthing
- [x] User Schema (username, email, password, avatar, followers, following)
- [x] Register API với validation + bcrypt password hashing

### 🔄 Đang phát triển
- [ ] Login API + Credentials Provider
- [ ] Trang Register / Login UI
- [ ] Middleware bảo vệ route
- [ ] Trang Profile người dùng
- [ ] Tính năng đăng bài viết + upload ảnh
- [ ] Newsfeed
- [ ] Like / Comment / Share
- [ ] Follow / Unfollow
- [ ] Thông báo real-time
- [ ] Chat trực tiếp
- [ ] Tìm kiếm người dùng & bài viết

---

## 📄 License

MIT © 2025
