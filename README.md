# AI Sales Agent

AI-SALES-AGENT is a full-stack AI-powered automation system designed to interact with customers, recommend products, automate sales, and provide an admin dashboard with analytics.

## Project Architecture
```text
User (Web / WhatsApp)
        ↓
Frontend (React Vite Dashboard)
        ↓
Firebase Functions (Backend API)
        ↓
AI Agent (OpenAI)
        ↓
RAG System (Product / Knowledge DB)
        ↓
Response → WhatsApp + Dashboard
```

## Folder Structure
- `frontend/`: React Vite UI Dashboard (Tailwind CSS)
- `firebase/`: Backend API (Firebase Functions + Firestore)
- `vector_db/`: RAG data and embeddings for product knowledge base
