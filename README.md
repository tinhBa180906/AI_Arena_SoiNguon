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

4. Tạo file `.env` từ `.env.example`:

```bash
copy .env.example .env
```

5. Cài dependency và chạy ứng dụng:

```bash
npm install
npm run dev
```

Vite chuyển tiếp request `/ollama` tới `VITE_OLLAMA_BASE_URL`, nên lúc phát triển không cần tắt bảo vệ CORS của trình duyệt. Model có thể đổi qua `VITE_OLLAMA_MODEL`.

### Gemini fallback

Điền API key vào `.env` nếu muốn dùng Gemini khi Ollama lỗi:

```dotenv
VITE_GEMINI_API_KEY=your_api_key_here
```

Không có Gemini key, ứng dụng vẫn hoạt động bình thường với Ollama và các câu FAQ lấy trực tiếp từ `culturalDb`. Không commit file `.env` hoặc API key thật lên Git.

## Luồng AI Advisor

1. Chuẩn hóa câu hỏi và kiểm tra cache trong phiên.
2. Trả lời FAQ phổ biến trực tiếp từ `culturalDb` nếu có thể.
3. Tìm tối đa hai bản ghi văn hóa liên quan và chạy Cultural Guard với câu hỏi phối đồ/remix.
4. Gửi context cùng tối đa 6 tin nhắn gần nhất tới Ollama.
5. Chỉ gọi Gemini nếu Ollama thất bại.

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
npm run build    # Type-check và build production
npm run lint     # Kiểm tra mã nguồn bằng Oxlint
npm run preview  # Xem bản production build
```
