
# 🚀 DocFlow - Full-Stack AP Intelligence

A production-grade document digitization SaaS with a React 19 frontend and Node.js Serverless backend.

## 🛠️ Production Deployment (Vercel)

DocFlow is optimized for Vercel's Serverless architecture. To deploy:

1. **Push to GitHub**: Connect your repository to Vercel.
2. **Environment Variables**:
   - In the Vercel Dashboard, go to **Settings > Environment Variables**.
   - Add `VITE_API_KEY`: Your Gemini API Key.
   - Add `API_KEY`: Your Gemini API Key (for serverless functions).
3. **Deploy**: Vercel will automatically build the React app and deploy the functions in `/api`.

## 📡 Backend Architecture

The application features a hybrid architecture:
- **Client-Side**: Manual uploads are processed in the browser for zero-latency feedback.
- **Server-Side (`/api/ingest`)**: The Inbound Gateway is a secure Node.js environment. This allows:
  - Secret API Key protection (the key never leaves the server for API requests).
  - Integration with services like **SendGrid Inbound Parse** or **Zapier**.
  - Long-running extraction tasks (up to 60s on Vercel Pro).

## 🗄️ Database Strategy
Currently, DocFlow uses **LocalStorage** and **IndexedDB** for zero-setup demo purposes. For a multi-user production environment:
1. Update `services/db.ts` to fetch from a real API instead of LocalStorage.
2. We recommend **Vercel Postgres** or **Supabase** for the document records and **Vercel Blob** or **AWS S3** for the PDF storage.

## 🔒 Security
- **RBAC**: Role-based access is enforced in the UI and should be mirrored in your DB queries.
- **Gateway Tokens**: Inbound requests require a `Bearer df_...` token generated in the Admin Panel.
