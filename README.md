# 🖐️ Gestura — Modern Real-time Communication & AI Platform

**Gestura** is an innovative web platform that combines **real-time chat, video calling**, and **AI-powered gesture & sign language recognition**.  
Our goal is simple — to make communication smarter, more inclusive, and accessible for everyone.  
Gestura brings together modern web technology and intelligent machine learning to help users connect effortlessly through gestures.

---

## 🚀 Key Features

- **Real-time chat & video calling** powered by Stream SDK  
- **Gesture & sign language recognition** (frame capture → detection → overlay)  
- **Seamless user synchronization** via Inngest (Clerk → DB → Stream)  
- **JWT-based authentication** with Clerk integration  
- **Secure CORS-enabled cookie authentication** for cross-origin setups  
- **Error tracking & observability** with Sentry  
- **Stream token generation** and background event handling with Inngest  
- **Modern, fast, responsive UI** using React, Vite, and TailwindCSS  

---

## 🧠 Tech Stack

### **Frontend**
- React 18  
- Vite (super-fast dev build system)  
- TailwindCSS (utility-first styling)  
- Stream Video SDK (real-time chat/video)  
- Clerk React (authentication)  
- React Router v6  
- TanStack React Query (data fetching & caching)  
- Framer Motion (smooth animations)

### **Backend**
- Node.js & Express  
- MongoDB & Mongoose  
- Inngest (background jobs and event handling)  
- Stream Chat & Video SDKs  
- JWT Authentication  
- Sentry for error monitoring  
- Clerk integration for identity management  

### **AI/ML**  
- Model: FastAPI, PyTorch, DETR (ResNet-50), OpenCV
 
---

## 🔐 Environment Variables

### **Backend `.env`**
```env
PORT=4000
NODE_ENV=development

MONGODB_URI=<your_mongo_connection_string>

# Clerk (if you use Clerk)
CLERK_API_KEY=<your_clerk_api_key>
CLERK_API_SECRET=<your_clerk_api_secret>

# Stream (server)
STREAM_API_KEY=<your_stream_api_key>
STREAM_API_SECRET=<your_stream_api_secret>

# JWT settings
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=7d

# Admin credentials (for demo)
ADMIN_ID=admin@example.com
ADMIN_PASS=password

# Allowed frontend URLs (CORS)
CLIENT_ORIGIN=http://localhost:5173,https://your-frontend-domain.com

# Optional tools
SENTRY_DSN=<your_sentry_dsn>
INNGEST_API_KEY=<your_inngest_api_key>
```

### **Frontend `.env`**
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_STREAM_API_KEY=<your_stream_frontend_api_key>
VITE_SENTRY_DSN=<optional_sentry_dsn>
```

---

## 🎥 How Gesture Detection Works

Gestura uses a **frame-based AI recognition pipeline**:
1. When a user joins a video call, the camera feed is captured in real-time.  
2. Frames are periodically extracted (2–3 fps) and sent to the backend AI model.  
3. The model analyzes hand shapes, movement, and position using deep learning.  
4. Detected gestures or signs are returned and displayed as **on-screen overlays**.  
5. Both users can instantly see the recognized gestures, enabling accessible communication.

This creates a real-time loop of **capture → detect → visualize**, allowing seamless and inclusive interaction.

---