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
| **File Upload** | [Uploadthing](https://uploadthing.com) |
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
│   │   │   ├── auth/[...nextauth]/route.ts   # Auth.js handler
│   │   │   ├── auth/register/route.ts        # Register API
│   │   │   ├── posts/route.ts                # GET + POST posts
│   │   │   ├── posts/[postId]/like/route.ts  # Toggle like
│   │   │   ├── posts/[postId]/comments/route.ts  # Comments
│   │   │   ├── follow/route.ts               # Follow / Unfollow
│   │   │   └── uploadthing/route.ts          # File upload handler
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx                          # Newsfeed
│   ├── auth.ts
│   ├── components/
│   │   ├── CreatePostForm.tsx
│   │   ├── PostCard.tsx
│   │   ├── FollowButton.tsx
│   │   └── providers.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   └── uploadthing.ts
│   └── models/
│       ├── User.ts
│       ├── Post.ts
│       └── Comment.ts
├── .env.example
├── .env.local
├── next.config.ts
└── tsconfig.json
```

---

## ⚙️ Cài đặt & Chạy local

### Yêu cầu

- Node.js >= 18
- pnpm >= 8
- Tài khoản MongoDB Atlas
- Tài khoản Uploadthing

### 1. Clone & cài dependencies

```bash
git clone https://github.com/your-username/social-network.git
cd social-network
pnpm install
```

### 2. Cấu hình .env.local

```env
MONGODB_URI=mongodb://...
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_URL=http://localhost:3000
UPLOADTHING_TOKEN=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Windows:** Dùng Standard URI thay vì mongodb+srv://. Thêm NODE_OPTIONS=--dns-result-order=ipv4first nếu gặp lỗi DNS.

### 3. Chạy dev

```bash
pnpm dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | /api/auth/register | Đăng ký | ❌ |
| GET | /api/posts | Newsfeed (theo following) | ❌ |
| POST | /api/posts | Tạo bài viết | ✅ |
| POST | /api/posts/:id/like | Toggle like | ✅ |
| GET | /api/posts/:id/comments | Lấy comments | ❌ |
| POST | /api/posts/:id/comments | Tạo comment | ✅ |
| POST | /api/follow | Follow/Unfollow | ✅ |
| GET/POST | /api/uploadthing | Upload file | ✅ |

---

## 📜 Scripts

```bash
pnpm dev     # Dev server (Turbopack)
pnpm build   # Production build
pnpm lint    # ESLint
```

---

## 🌱 Roadmap

### ✅ Hoàn thành

- [x] Next.js 15 App Router + TypeScript + Tailwind v4 + Shadcn/ui
- [x] MongoDB Atlas (Mongoose Singleton, fix DNS Windows)
- [x] Auth.js v5 — Credentials + GitHub + Google OAuth
- [x] UI Đăng ký / Đăng nhập (Zod + react-hook-form)
- [x] User / Post / Comment Schema (Mongoose)
- [x] Uploadthing — upload ảnh cloud, lưu URL vào MongoDB
- [x] Newsfeed API cá nhân hóa ( filter theo following)
- [x] CreatePostForm (upload ảnh multi + preview)
- [x] PostCard (grid ảnh responsive, thời gian tương đối)
- [x] TanStack React Query (cache + invalidation)
- [x] Follow / Unfollow ( /  cả 2 chiều)
- [x] FollowButton Optimistic UI
- [x] Like / Unlike — Optimistic Updates (onMutate/onError/onSettled)
- [x] Comment System — API + UI xổ xuống
- [x] Đăng xuất (signOut)

### 🔄 Đang phát triển

- [ ] Trang Profile (/user/[username])
- [ ] Tìm kiếm người dùng ()
- [ ] Middleware bảo vệ route
- [ ] Thông báo real-time

---

## 📄 License

MIT © 2025
