# 🌐 Social Network

Dự án Mạng xã hội full-stack được xây dựng trên nền tảng **Next.js 15 App Router**, sử dụng hệ sinh thái công nghệ hiện đại, production-ready.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + [Shadcn/ui](https://ui.shadcn.com) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com) |
| **Auth** | [Auth.js v5](https://authjs.dev) (GitHub OAuth, Google OAuth) |
| **Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) |
| **Global State** | [Zustand](https://zustand-demo.pmnd.rs) |
| **File Upload** | [Uploadthing](https://uploadthing.com) |

---

## 📁 Cấu trúc dự án

```
social-network/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # Auth.js handler
│   │   │   └── uploadthing/          # Uploadthing handler
│   │   ├── globals.css
│   │   ├── layout.tsx          # Root layout (Server Component)
│   │   └── page.tsx
│   ├── auth.ts                 # Auth.js config trung tâm
│   ├── components/
│   │   ├── providers.tsx       # Client Providers (Session + Query)
│   │   └── ui/                 # Shadcn/ui components
│   ├── lib/
│   │   ├── db.ts               # Mongoose Singleton connection
│   │   ├── query-client.ts     # TanStack Query client
│   │   └── utils.ts            # Shadcn utilities
│   └── store/
│       └── ui-store.ts         # Zustand global state
├── .env.local                  # Biến môi trường (không commit)
├── components.json             # Shadcn config
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

Tạo file `.env.local` từ file mẫu:

```bash
cp .env.example .env.local
```

Điền các giá trị vào `.env.local`:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Auth.js
AUTH_SECRET=your_auth_secret        # Tạo bằng: pnpm dlx auth secret
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000

# Uploadthing
UPLOADTHING_TOKEN=your_uploadthing_token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Chạy dev server

```bash
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

---

## 🔑 Tạo OAuth Apps

### GitHub OAuth
1. Vào [GitHub Developer Settings](https://github.com/settings/developers)
2. **New OAuth App**
3. Homepage URL: `http://localhost:3000`
4. Callback URL: `http://localhost:3000/api/auth/callback/github`

### Google OAuth
1. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Create Credentials → OAuth Client ID**
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

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

- [ ] Đăng nhập / Đăng ký (GitHub, Google OAuth)
- [ ] Trang Profile người dùng
- [ ] Đăng bài viết + upload ảnh
- [ ] Newsfeed
- [ ] Like / Comment / Share
- [ ] Follow / Unfollow
- [ ] Thông báo real-time
- [ ] Chat trực tiếp
- [ ] Tìm kiếm người dùng & bài viết

---

## 📄 License

MIT © 2025
