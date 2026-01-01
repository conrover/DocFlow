
# 🚀 DocFlow - AP Audit Intelligence

A production-grade document digitization SaaS for structured data extraction using Gemini.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/your-username/your-repo-name)

## 🛠️ Quick Start

### Option A: Vercel Dashboard (Recommended)
1. **Push to GitHub**: Create a new repo and push your code.
2. **Import to Vercel**: Go to [vercel.com/new](https://vercel.com/new).
3. **Environment Variables**: Add `VITE_API_KEY` in the "Environment Variables" section.
4. **Deploy**: Vercel detects Vite automatically. Click **Deploy**.

### Option B: Vercel CLI
If you prefer the terminal:
```bash
# 1. Install CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Set your Gemini API Key
vercel env add VITE_API_KEY

# 5. Deploy to Production
vercel --prod
```

## 🏗️ Architecture Note
- **Frontend**: React 19 + Vite + Tailwind CSS
- **AI Engine**: Gemini 3 Flash (Extraction) & Gemini 3 Pro (Chat)
- **Storage**: IndexedDB (Local persistent blob storage for PDFs)
- **Routing**: Handled by Vercel Rewrites in `vercel.json`

## 🔒 Security
The application is configured with strict security headers (XSS protection, Frame Deny) via `vercel.json`. Ensure you restrict your Google AI API key to your specific Vercel domain in the Google AI Dashboard.
