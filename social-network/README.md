# 🌐 Social Network

Dự án Mạng xã hội full-stack được xây dựng trên nền tảng **Next.js 15 App Router**, sử dụng hệ sinh thái công nghệ hiện đại, production-ready.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + [Shadcn/ui](https://ui.shadcn.com) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com) |
| **Auth** | [Auth.js v5](https://authjs.dev) (Credentials, GitHub OAuth, Google OAuth) |
| **Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) |
| **Global State** | [Zustand](https://zustand-demo.pmnd.rs) |
| **File Upload** | [Uploadthing](https://uploadthing.com) *(coming soon)* |
| **Password Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Form Validation** | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Date Formatting** | [date-fns](https://date-fns.org) |

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
│   │   │   └── posts/
│   │   │       └── route.ts                # GET + POST posts API
│   │   ├── login/page.tsx                  # Trang đăng nhập
│   │   ├── register/page.tsx               # Trang đăng ký
│   │   ├── globals.css
│   │   ├── layout.tsx                      # Root layout
│   │   └── page.tsx                        # Trang chủ (Newsfeed)
│   ├── auth.ts                             # Auth.js config (Credentials + OAuth)
│   ├── components/
│   │   ├── CreatePostForm.tsx              # Form đăng bài
│   │   ├── PostCard.tsx                    # Card hiển thị bài viết
│   │   ├── providers.tsx                   # SessionProvider + QueryClientProvider
│   │   └── ui/                             # Shadcn/ui components
│   ├── lib/
│   │   ├── db.ts                           # Mongoose Singleton connection
│   │   ├── query-client.ts                 # TanStack Query client
│   │   └── utils.ts
│   ├── models/
│   │   ├── User.ts                         # User Schema & Model
│   │   └── Post.ts                         # Post Schema & Model
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
- GitHub OAuth App & Google OAuth App

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

Điền đầy đủ vào `.env.local`:

```env
# Database (MongoDB Atlas — dùng Standard URI, không dùng SRV)
MONGODB_URI=mongodb://user:pass@host1:27017,host2:27017,host3:27017/social_network_db?...

# Auth.js v5
AUTH_SECRET=           # Tạo: pnpm dlx auth secret
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Uploadthing
UPLOADTHING_TOKEN=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Lưu ý Windows:** Nếu gặp lỗi DNS SRV với MongoDB Atlas, thêm `NODE_OPTIONS=--dns-result-order=ipv4first` vào `.env.local` và dùng Standard URI thay vì `mongodb+srv://`.

### 4. Chạy dev server

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000).

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `GET/POST` | `/api/auth/[...nextauth]` | Auth.js handler |
| `GET` | `/api/auth/session` | Lấy session hiện tại |

### Posts

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/api/posts` | Lấy danh sách bài viết | ❌ |
| `POST` | `/api/posts` | Tạo bài viết mới | ✅ |

---

## 🔑 Tạo OAuth Apps

### GitHub OAuth
1. [GitHub Developer Settings](https://github.com/settings/developers) → **New OAuth App**
2. Callback URL: `http://localhost:3000/api/auth/callback/github`

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **OAuth Client ID**
2. Redirect URI: `http://localhost:3000/api/auth/callback/google`

---

## 📜 Scripts

```bash
pnpm dev        # Dev server (Turbopack)
pnpm build      # Production build
pnpm start      # Production server
pnpm lint       # ESLint
```

---

## 🌱 Roadmap

### ✅ Hoàn thành
- [x] Setup Next.js 15 (App Router, TypeScript, Tailwind v4, Shadcn/ui)
- [x] Kết nối MongoDB Atlas (Mongoose Singleton, fix DNS Windows)
- [x] Auth.js v5 — Credentials + GitHub + Google OAuth
- [x] JWT & Session callbacks (truyền `id`, `username` vào session)
- [x] UI Đăng ký / Đăng nhập (Glassmorphism, Zod validation, react-hook-form)
- [x] User Schema (username, email, password hash, avatar, followers, following)
- [x] Post Schema (user, content, images, likes, timestamps)
- [x] Register API (validate + bcrypt hash)
- [x] Post API — GET (populate user, sort mới nhất) + POST (auth guard)
- [x] Newsfeed layout (sidebar + feed + trending)
- [x] CreatePostForm (useMutation + invalidateQueries + image preview)
- [x] PostCard (avatar, thời gian tương đối, like/comment/share UI)
- [x] TanStack React Query (cache, background refetch)

### 🔄 Đang phát triển
- [ ] Middleware — bảo vệ route cần đăng nhập
- [ ] Like API — toggle like bài viết
- [ ] Comment Model + API + UI
- [ ] Upload ảnh thật (Uploadthing integration)
- [ ] Trang Profile người dùng
- [ ] Follow / Unfollow
- [ ] Thông báo real-time (Socket.io)
- [ ] Chat trực tiếp
- [ ] Tìm kiếm người dùng & bài viết

---

## 📄 License

MIT © 2025
