<div align="center">

# 🏮 Sắc Việt Remix

**Mặc truyền thống, sống Gen Z – Đẹp và Đúng**

[![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-brightgreen)](https://oxc.rs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  Ứng dụng khám phá và phối trang phục truyền thống Việt Nam theo phong cách hiện đại, tích hợp bộ lọc văn hoá <strong>Cultural Guard</strong> và trợ lý thông minh.
</p>

[Khám phá Tính năng](#-tính-năng-chính) •
[Cài đặt & Khởi chạy](#-bắt-đầu-nhanh) •
[Cấu trúc Dự án](#-cấu-trúc-thư-mục) •
[Cấu hình Công cụ](#-cấu-hình--tối-ưu)

</div>

---

## ✨ Tính năng chính

- 👘 **Smart Styling Wizard**: Phối đồ 4 bước theo bối cảnh, sự kiện, tông màu ngũ hành và mức độ remix.
- 🛡️ **Cultural Guard**: Rule engine tất định kiểm tra tính chuẩn mực văn hoá trước khi gợi ý phối đồ.
- 🎨 **Neo-Heritage Design**: Giao diện Mobile-first mang bảng màu cung đình và dân gian đặc trưng.
- ⚡ **Ultra Fast DX**: Khởi động tức thì với Vite, tối ưu kiểm tra mã nguồn bằng Oxlint.

---

## 🚀 Bắt đầu nhanh

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản `20.x` trở lên
- Trình quản lý gói: `npm`, `pnpm`, hoặc `yarn`

### Cài đặt

```bash
# 1. Clone repository
git clone <repository-url>
cd sac-viet-remix

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy môi trường phát triển
npm run dev
```

## AI Advisor Setup

Chatbot dùng Ollama trên máy làm provider chính. Gemini chỉ được gọi khi Ollama không chạy, timeout, lỗi mạng hoặc trả về response không hợp lệ.

1. Cài [Ollama](https://ollama.com/download).
2. Tải model mặc định:

```bash
ollama pull qwen3:4b
```

3. Đảm bảo Ollama đang chạy. Có thể mở ứng dụng Ollama hoặc chạy:

```bash
ollama serve
```

4. Tạo file `.env.local` từ `.env.example`:

```powershell
Copy-Item .env.example .env.local
```

5. Cài dependency và chạy ứng dụng:

```bash
npm install
npm run dev
```

Vite chuyển tiếp request `/ollama` tới `VITE_OLLAMA_BASE_URL`, nên lúc phát triển không cần tắt bảo vệ CORS của trình duyệt. Model có thể đổi qua `VITE_OLLAMA_MODEL`.

### Gemini fallback

Gemini luôn được gọi qua Vercel Function `POST /api/chat`. API key chỉ được đọc ở phía server và không được đưa vào mã frontend. Để thử đầy đủ luồng Ollama → Gemini trên máy local, điền key vào `.env.local`:

```dotenv
GEMINI_API_KEY=your_api_key_here
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen3:4b
```

Cài Vercel CLI rồi chạy môi trường local có cả frontend và Function:

```powershell
npm install -g vercel
vercel dev
```

`npm run dev` vẫn dùng được khi chỉ cần Vite + Ollama. Nếu Ollama thất bại trong chế độ này, `/api/chat` chỉ hoạt động khi Function được phục vụ bởi `vercel dev`. Không commit `.env`, `.env.local`, thư mục `.vercel` hoặc API key thật lên Git.

## Luồng AI Advisor

1. Chuẩn hóa câu hỏi và kiểm tra cache trong phiên.
2. Trả lời FAQ phổ biến trực tiếp từ `culturalDb` nếu có thể.
3. Tìm tối đa hai bản ghi văn hóa liên quan và chạy Cultural Guard với câu hỏi phối đồ/remix.
4. Trên localhost, gửi context cùng tối đa 6 tin nhắn gần nhất tới Ollama.
5. Nếu Ollama thất bại, frontend gọi `POST /api/chat` và Vercel Function gọi Gemini bằng `GEMINI_API_KEY` phía server.
6. Trên production, bỏ qua Ollama và gọi thẳng `POST /api/chat`.

## Cấu trúc thư mục

```text
src/
├── components/             # UI phối đồ, chatbot, lookbook và thẻ văn hóa
├── data/                   # Cultural database và image manifest
├── rules/                  # Cultural Guard rule engine
├── services/
│   ├── ai/                 # Provider Ollama/Gemini và advisor orchestration
│   ├── aiService.ts        # Service tạo outfit hiện có
│   └── culturalSearch.ts   # Tìm context và tạo FAQ từ culturalDb
├── store/                  # Zustand app state
├── App.tsx                 # Điều hướng và trải nghiệm phối đồ chính
└── main.tsx                # React entry point
```

## Scripts

```bash
npm run dev      # Chạy Vite development server
npm run dev:vercel # Chạy frontend + Vercel Function ở local
npm run build    # Type-check và build production
npm run lint     # Kiểm tra mã nguồn bằng Oxlint
npm run preview  # Xem bản production build
```

## Deploy Vercel riêng

Các bước dưới đây tạo một Vercel project mới trong tài khoản của bạn và không liên kết với Vercel project cũ của team.

```powershell
cd D:\AI_Arena_SoiNguon
npm install
npm run build
npm install -g vercel
vercel login
vercel
```

Trả lời các câu hỏi của Vercel CLI:

- `Set up and deploy?` → `Yes`
- `Scope` → chọn tài khoản Vercel của bạn
- `Link to existing project?` → `No`
- `Project name` → `soi-nguon-ductien`
- `Directory` → `./`
- `Override settings?` → `No`

Sau khi project mới được tạo, thêm Gemini key dưới dạng secret. CLI sẽ yêu cầu bạn nhập giá trị; không dán key vào câu lệnh để tránh lưu key trong lịch sử PowerShell.

```powershell
vercel env add GEMINI_API_KEY production --sensitive
vercel env add GEMINI_API_KEY preview --sensitive
```

Biến `preview` chỉ cần khi bạn muốn AI hoạt động trên các Preview Deployment. Deploy production sau khi thêm secret:

```powershell
vercel --prod
```

Kiểm tra Function sau khi deploy, thay URL mẫu bằng domain production Vercel vừa nhận được:

```powershell
$body = @{
  messages = @(
    @{ role = 'user'; content = 'Áo ngũ thân là gì?' }
  )
  context = @{
    culturalContext = ''
    guardContext = ''
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri 'https://soi-nguon-ductien.vercel.app/api/chat' `
  -ContentType 'application/json' `
  -Body $body
```

Response thành công có dạng:

```json
{
  "text": "...",
  "provider": "gemini"
}
```

Sau mỗi lần sửa code, kiểm tra và deploy lại bằng:

```powershell
npm run build
vercel --prod
```

`GEMINI_API_KEY` chỉ tồn tại trong môi trường Vercel Function qua `process.env.GEMINI_API_KEY`. Frontend chỉ gọi `/api/chat`; không tạo biến có tiền tố `VITE_` cho Gemini key vì Vite sẽ đưa các biến đó vào bundle trình duyệt.
