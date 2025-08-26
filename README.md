# 🛡️ AmbientFi Compliance Platform

AmbientFi is an enterprise-grade compliance monitoring platform that helps financial institutions and regulated businesses reduce risk by proactively flagging potential compliance violations using cutting-edge AI technology.

## 🎯 Next Steps for Engineers

### 🚨 **Current Status: Demo Mode**
The application currently runs in **demo mode** with a fully functional frontend and mock AI compliance analysis. The backend has **26 TypeScript compilation errors** that need to be resolved for production.

### 🔥 **Immediate Priorities (Week 1-2)**

#### Backend Critical Fixes
1. **Fix TypeScript Compilation Errors** 
   - 26 errors in backend preventing proper API functionality
   - Main issues: undefined environment variables, incorrect type assertions
   - Files to fix: `src/config/configuration.ts`, all service files

2. **Set Up External Services**
   - Create Supabase project and deploy `supabase-schema.sql`
   - Get API keys for: OpenRouter, Pinecone, Exa AI, Perplexity
   - Set up Clerk authentication app

3. **Environment Configuration**
   - Update `backend/.env` with real API keys
   - Configure proper environment variable validation
   - Test all external service connections

### 🎮 **Try the Demo First!**

Before diving into development, experience what we're building:

1. **Visit**: `http://localhost:3000/demo`
2. **Try Examples**:
   - PII Detection: "Customer SSN: 123-45-6789"
   - Promissory Statements: "We guarantee 100% returns"  
   - Safe Content: Normal business text
3. **Understand the Vision**: This demo shows exactly what the AI will do

### 📚 **Documentation**

- **New Engineers**: [`docs/NEW_ENGINEER_ONBOARDING.md`](./docs/NEW_ENGINEER_ONBOARDING.md)
- **Production Readiness**: [`docs/PRODUCTION_READINESS.md`](./docs/PRODUCTION_READINESS.md)  
- **Deployment Guide**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

### ⏱️ **Timeline to Production**

**Estimated: 5-8 weeks total**
- **Phase 1** (2-3 weeks): Backend fixes and API integration
- **Phase 2** (1-2 weeks): Frontend-backend connection  
- **Phase 3** (1-2 weeks): Testing and optimization
- **Phase 4** (1 week): Production deployment

---

## ✨ Features

### 🔍 AI-Powered Compliance Analysis
- **Multi-LLM Integration**: OpenRouter with Claude, GPT-4o, and Gemini Pro for comprehensive analysis
- **Real-time Detection**: PII leakage, promissory statements, and regulatory violations
- **Hybrid Knowledge System**: Pinecone RAG for internal policies + Exa/Perplexity for regulatory updates
- **Risk Scoring**: Intelligent 0-100 risk assessment with confidence levels

### 🚀 Advanced Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, TypeScript, RESTful APIs
- **Database**: Supabase PostgreSQL with Row Level Security
- **Vector Database**: Pinecone for policy embeddings
- **AI Services**: OpenRouter, Exa AI, Perplexity Sonar
- **Authentication**: Clerk with role-based access control

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/iankar8/ambientficompliance.git
cd AmbientFi
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup (Optional - has TypeScript errors)
```bash
cd backend
npm install
npm run start:dev
```

**Visit `http://localhost:3000` to see the demo!**

---

Built with ❤️ by the AmbientFi Team