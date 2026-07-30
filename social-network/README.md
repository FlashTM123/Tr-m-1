# 🌐 Social Network

Dự án Mạng xã hội full-stack được xây dựng trên nền tảng **Next.js 15 App Router**, sử dụng hệ sinh thái công nghệ hiện đại, production-ready.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + [Shadcn/ui](https://ui.shadcn.com) + Lucide Icons |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com) |
| **Auth** | [Auth.js v5](https://authjs.dev) (Credentials, GitHub OAuth, Google OAuth) |
| **Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) |
| **File Upload** | [Uploadthing](https://uploadthing.com) (Multi-image, Video, Media Cloud Storage) |
| **Password Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Form Validation** | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Date Formatting** | [date-fns](https://date-fns.org) |

---

## ✨ Feature Highlights

- 🔐 **Xác thực đa phương thức**: Đăng nhập bằng Email/Password hoặc GitHub/Google OAuth 1-click. Tự động sync MongoDB User.
- 📰 **Bảng tin cá nhân hóa (Newsfeed)**: Lọc bài viết theo danh sách người theo dõi (Following), hỗ trợ Discovery mode cho người dùng mới.
- 📝 **Đăng bài viết & Media**: Hỗ trợ đăng văn bản kèm nhiều ảnh từ UploadThing Cloud.
- ❤️ **Like & Comment (Optimistic UI)**: Phản hồi tức thì không cần chờ server response.
- 👥 **Hệ thống Follow / Unfollow**: Theo dõi 2 chiều với nút bấm Optimistic Update.
- 📖 **Story 24h (Tích hợp Media/Video)**:
  - Thanh Story ngang phía trên Bảng tin với nút tạo nhanh.
  - Hỗ trợ Upload cả Ảnh (tối đa 32MB) và Video (tối đa 64MB).
  - Trình xem Story toàn màn hình (Full-screen Viewer) kèm thanh tiến trình tự động (Progress bars), phím điều hướng `←`/`→`, giữ chuột để tạm dừng.
  - Tự động xóa khỏi Database sau 24h nhờ **MongoDB TTL Index**.
- 👤 **Trang cá nhân (`/user/[username]`)**:
  - Giao diện thiết kế gối viền hiện đại, hiển thị Bio, thống kê bài viết/followers/following.
  - Lưới bài viết 3 cột chuẩn Instagram kèm modal xem chi tiết.

---

## 📁 Cấu trúc dự án

```
social-network/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # Auth.js handler
│   │   │   ├── auth/register/route.ts        # API Đăng ký
│   │   │   ├── posts/route.ts                # API Bài viết (GET feed / POST)
│   │   │   ├── posts/[postId]/like/route.ts  # Toggle like (Optimistic)
│   │   │   ├── posts/[postId]/comments/route.ts # API Bình luận
│   │   │   ├── stories/route.ts              # API Stories (GET active / POST)
│   │   │   ├── stories/[storyId]/route.ts    # API Story DELETE & view count
│   │   │   ├── user/[username]/route.ts      # API Profile & User posts
│   │   │   ├── follow/route.ts               # API Follow / Unfollow
│   │   │   └── uploadthing/route.ts          # Handler Uploadthing Media
│   │   ├── user/[username]/page.tsx          # Trang cá nhân
│   │   ├── login/page.tsx                    # Trang Đăng nhập
│   │   ├── register/page.tsx                 # Trang Đăng ký
│   │   ├── layout.tsx
│   │   └── page.tsx                          # Trang chủ (Newsfeed + StoryBar)
│   ├── auth.ts                               # Auth.js configuration
│   ├── components/
│   │   ├── CreatePostForm.tsx
│   │   ├── PostCard.tsx
│   │   ├── FollowButton.tsx
│   │   ├── StoryBar.tsx                      # Thanh hiển thị Story
│   │   ├── StoryViewer.tsx                   # Modal phát Story full-screen
│   │   └── providers.tsx
│   ├── lib/
│   │   ├── db.ts                             # Connection Mongoose Singleton
│   │   └── uploadthing.ts
│   └── models/
│       ├── User.ts
│       ├── Post.ts
│       ├── Comment.ts
│       └── Story.ts                          # Schema Story 24h
├── .env.example
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

### 2. Cấu hình file `.env`

Tạo file `.env` ở thư mục gốc:

```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=your_nextauth_secret
AUTH_GITHUB_ID=your_github_id
AUTH_GITHUB_SECRET=your_github_secret
AUTH_GOOGLE_ID=your_google_id
AUTH_GOOGLE_SECRET=your_google_secret
NEXTAUTH_URL=http://localhost:3000
UPLOADTHING_TOKEN=your_uploadthing_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Chạy môi trường Dev

```bash
pnpm dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 📡 API Endpoints

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản | ❌ |
| GET | `/api/posts` | Newsfeed (lọc theo following) | ❌ |
| POST | `/api/posts` | Tạo bài viết mới | ✅ |
| POST | `/api/posts/:id/like` | Toggle thích / bỏ thích | ✅ |
| GET | `/api/posts/:id/comments` | Lấy danh sách bình luận | ❌ |
| POST | `/api/posts/:id/comments` | Bình luận bài viết | ✅ |
| GET | `/api/stories` | Lấy danh sách Story chưa hết hạn | ❌ |
| POST | `/api/stories` | Tạo Story mới (ảnh / video) | ✅ |
| DELETE | `/api/stories/:id` | Xóa Story của chính mình | ✅ |
| PATCH | `/api/stories/:id` | Đánh dấu đã xem Story | ✅ |
| GET | `/api/user/:username` | Lấy thông tin profile & bài viết của user | ❌ |
| POST | `/api/follow` | Follow / Unfollow người dùng | ✅ |
| GET/POST | `/api/uploadthing` | Handler Upload media | ✅ |

---

## 📜 Scripts

```bash
pnpm dev     # Dev server (Turbopack)
pnpm build   # Production build
pnpm lint    # ESLint check
```

---

## 🌱 Roadmap

### ✅ Hoàn thành

- [x] Next.js 15 App Router + TypeScript + Tailwind v4 + Shadcn/ui
- [x] MongoDB Atlas (Mongoose Singleton, fix connection caching & IPv4)
- [x] Auth.js v5 — Credentials + GitHub + Google OAuth (OAuth User Auto-Sync)
- [x] UI Đăng ký / Đăng nhập (Zod + react-hook-form)
- [x] Schema Mongoose: User, Post, Comment, Story
- [x] Uploadthing — upload media cloud (ảnh bài viết, avatar, story video/ảnh)
- [x] Newsfeed cá nhân hóa (lọc theo following & Discovery mode)
- [x] CreatePostForm (Multi-image preview & upload)
- [x] PostCard (Optimistic like, Comment section, relative date)
- [x] TanStack React Query (Cache + Invalidation + Optimistic UI)
- [x] System Follow / Unfollow (2 chiều)
- [x] Trang Profile (`/user/[username]`) — Bio, Grid bài viết 3 cột, Modal preview
- [x] Tính năng Story 24h — Thanh StoryBar, Full-screen Viewer, Progress bars, Video/Image support, 24h Auto-expire (TTL index)

---

## 📄 License

MIT © 2026
