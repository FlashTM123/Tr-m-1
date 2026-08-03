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
| **Real-time** | Server-Sent Events (SSE) + EventSource Stream |
| **File Upload** | [Uploadthing](https://uploadthing.com) (Multi-image, Video, Media Cloud Storage) |
| **Password Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Form Validation** | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Date Formatting** | [date-fns](https://date-fns.org) |

---

## ✨ Feature Highlights

- 🔐 **Xác thực đa phương thức**: Đăng nhập bằng Email/Password hoặc GitHub/Google OAuth. Middleware bảo vệ private routes.
- ⚡ **Thông báo Real-time (Server-Sent Events)**:
  - Tự động nhận thông báo khi có ai Thích, Bình luận hoặc Theo dõi bạn không cần F5.
  - Toast popup hiển thị tức thì toàn ứng dụng kèm badge đếm số thông báo chưa đọc.
  - Tự động kết nối lại (Exponential backoff) & Heartbeat giữ kết nối 25s.
- 📰 **Bảng tin cá nhân hóa (Newsfeed)**: Tab "Dành cho bạn" & Tab "Đang theo dõi", hỗ trợ gợi ý theo dõi thông minh từ DB.
- 📝 **Đăng bài viết & Media**: Hỗ trợ đăng văn bản kèm nhiều ảnh từ UploadThing Cloud.
- ❤️ **Like & Comment (Optimistic UI)**: Phản hồi tức thì không chờ server response.
- 🔖 **Lưu bài viết (Bookmarks)**: Lưu bài viết yêu thích và xem lại tại trang `/saved` dạng lưới Instagram.
- 🔍 **Tìm kiếm người dùng (`/search`)**: Tìm kiếm theo Username với debounce 350ms & thao tác follow trực tiếp.
- ⚙️ **Cài đặt hồ sơ (`/settings`)**: Đổi avatar (UploadThing), cập nhật Bio & Username.
- 👥 **Quản lý Bạn bè (`/friends`)**: Danh sách Người theo dõi (Followers) & Đang theo dõi (Following).
- 📄 **Chi tiết bài viết (`/post/[postId]`)**: Xem chi tiết bài viết kèm Carousel chuyển ảnh & bình luận.
- 📖 **Story 24h (Media/Video)**:
  - Thanh Story ngang phía trên Bảng tin với nút tạo nhanh.
  - Full-screen Viewer với thanh tiến trình tự động, tạm dừng khi giữ chuột.
  - Tự động xóa khỏi Database sau 24h nhờ **MongoDB TTL Index**.
- 👤 **Trang cá nhân (`/user/[username]`)**: Bio, thống kê bài viết/followers/following, lưới bài viết 3 cột.

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
│   │   │   ├── posts/[postId]/route.ts       # API Chi tiết bài viết
│   │   │   ├── posts/[postId]/like/route.ts  # Toggle like + trigger SSE
│   │   │   ├── posts/[postId]/comments/route.ts # API Bình luận + trigger SSE
│   │   │   ├── posts/[postId]/bookmark/route.ts # API Toggle bookmark
│   │   │   ├── notifications/route.ts        # API Danh sách thông báo
│   │   │   ├── notifications/stream/route.ts # SSE Real-time Stream endpoint
│   │   │   ├── search/route.ts               # API Tìm kiếm user
│   │   │   ├── settings/route.ts             # API Cập nhật profile
│   │   │   ├── stories/route.ts              # API Stories (GET active / POST)
│   │   │   ├── stories/[storyId]/route.ts    # API Story DELETE & view count
│   │   │   ├── user/[username]/route.ts      # API Profile & User posts
│   │   │   ├── user/bookmarks/route.ts       # API Lấy bài viết đã lưu
│   │   │   ├── user/friends/route.ts         # API Lấy danh sách followers/following
│   │   │   ├── user/suggestions/route.ts     # API Gợi ý theo dõi
│   │   │   ├── follow/route.ts               # API Follow / Unfollow + trigger SSE
│   │   │   └── uploadthing/route.ts          # Handler Uploadthing Media
│   │   ├── friends/page.tsx                  # Trang bạn bè (Followers/Following)
│   │   ├── notifications/page.tsx            # Trang thông báo
│   │   ├── post/[postId]/page.tsx            # Trang chi tiết bài viết
│   │   ├── saved/page.tsx                    # Trang bài viết đã lưu
│   │   ├── search/page.tsx                   # Trang tìm kiếm
│   │   ├── settings/page.tsx                 # Trang cài đặt hồ sơ
│   │   ├── user/[username]/page.tsx          # Trang cá nhân
│   │   ├── login/page.tsx                    # Trang Đăng nhập
│   │   ├── register/page.tsx                 # Trang Đăng ký
│   │   ├── layout.tsx                        # Root layout
│   │   └── page.tsx                          # Trang chủ (Newsfeed + Sidebar)
│   ├── auth.ts                               # Auth.js Node.js runtime config
│   ├── auth.config.ts                        # Auth.js Edge-safe config (dùng cho middleware)
│   ├── middleware.ts                         # Edge Route protection
│   ├── components/
│   │   ├── CreatePostForm.tsx
│   │   ├── PostCard.tsx
│   │   ├── StoryBar.tsx
│   │   ├── StoryViewer.tsx
│   │   ├── SSEProvider.tsx                   # Client-side SSE mount point
│   │   └── providers.tsx
│   ├── hooks/
│   │   └── useSSENotifications.ts            # Custom hook quản lý kết nối EventSource SSE
│   ├── lib/
│   │   ├── db.ts                             # Connection Mongoose Singleton
│   │   ├── sse.ts                            # SSE Connection Manager (Global Map)
│   │   └── uploadthing.ts
│   ├── models/
│   │   ├── User.ts                           # Added bookmarks array
│   │   ├── Post.ts
│   │   ├── Comment.ts
│   │   ├── Story.ts
│   │   └── Notification.ts                   # Schema Notification
│   └── types/
│       └── notification.ts                   # Shared notification types
├── .env
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
AUTH_TRUST_HOST=true
UPLOADTHING_TOKEN=your_uploadthing_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Chạy môi trường Dev

```bash
pnpm dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

### 4. Build & Chạy Production

```bash
pnpm build
pnpm start
```

---

## 📡 API Endpoints chính

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản | ❌ |
| GET | `/api/posts` | Newsfeed (lọc theo query `?feed=following`) | ❌ |
| POST | `/api/posts` | Tạo bài viết mới | ✅ |
| GET/POST | `/api/posts/:id` | Lấy chi tiết bài viết | ❌ |
| POST | `/api/posts/:id/like` | Toggle thích / bỏ thích (trigger SSE) | ✅ |
| POST | `/api/posts/:id/bookmark` | Toggle lưu bài viết | ✅ |
| GET/POST | `/api/posts/:id/comments` | Lấy & Tạo bình luận (trigger SSE) | ✅ |
| GET | `/api/notifications` | Lấy danh sách thông báo | ✅ |
| GET | `/api/notifications/stream` | Server-Sent Events (SSE) Stream | ✅ |
| PATCH | `/api/notifications` | Đánh dấu tất cả thông báo là đã đọc | ✅ |
| GET | `/api/search` | Tìm kiếm người dùng | ❌ |
| GET/PUT | `/api/settings` | Lấy & Cập nhật thông tin profile | ✅ |
| GET | `/api/user/bookmarks` | Lấy danh sách bài viết đã lưu | ✅ |
| GET | `/api/user/friends` | Lấy danh sách Followers / Following | ✅ |
| GET | `/api/user/suggestions` | Gợi ý người dùng theo dõi | ✅ |
| POST | `/api/follow` | Follow / Unfollow người dùng (trigger SSE) | ✅ |

---

## 📜 Scripts

```bash
pnpm dev     # Dev server (Turbopack)
pnpm build   # Production build
pnpm start   # Production server
pnpm lint    # ESLint check
```

---

## 🌱 Roadmap

### ✅ Hoàn thành

- [x] Next.js 15 App Router + TypeScript + Tailwind v4 + Shadcn/ui
- [x] MongoDB Atlas (Mongoose Singleton)
- [x] Auth.js v5 — Credentials + GitHub + Google OAuth (Edge-safe config)
- [x] Middleware Route Protection & Auth Guard
- [x] Uploadthing — upload media cloud (ảnh bài viết, avatar, story video/ảnh)
- [x] Newsfeed cá nhân hóa (lọc theo Following & Discovery mode)
- [x] PostCard (Optimistic like, Bookmark button, Comment count, relative date)
- [x] Thông báo Real-time bằng Server-Sent Events (SSE) Stream
- [x] Trang Tìm kiếm (`/search`) với debounce
- [x] Trang Cài đặt hồ sơ (`/settings`)
- [x] Trang Chi tiết bài viết (`/post/[postId]`)
- [x] Trang Bài viết đã lưu (`/saved`)
- [x] Trang Bạn bè (`/friends`)
- [x] System Follow / Unfollow (2 chiều)
- [x] Trang Profile (`/user/[username]`)
- [x] Tính năng Story 24h (Video/Image support, TTL index auto-expire)

---

## 📄 License

MIT © 2026
