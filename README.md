# 📱 Task Management Application (Mobile & Web)
A cross-platform task management application built with **React Native (Expo)**, **React (Web)**, and a **Node.js/Apollo GraphQL** backend, featuring an authentic Apple-inspired UI design system (iOS 18 aesthetic, Face ID authentication HUD, and Dynamic Island notifications).

---

## 📂 Repository Structure

├── backend/       # Node.js + Apollo GraphQL Server (CRUD & Auth resolvers)
├── mobile/        # React Native & Expo application (iOS 18 UI, Face ID HUD, Dynamic Island)
└── web/           # React web application deployed on Vercel

```

---

## 🚀 Setup & Installation Instructions

### 1. Start the GraphQL Backend

cd backend
npm install
npm start

```

*The Apollo GraphQL server will start at `http://localhost:4000`.*

### 2. Run the Mobile App (Expo Web / Simulator)

Open a second terminal window:

cd mobile
npm install
npx expo start --web

```

### 3. Run the Web App

Open a third terminal window:

cd web
npm install
npm start

```

---

## 💡 Interview Demo Credentials

Email: `test@test.com`
Password: `password123`

---

## 🏛️ Architecture Decisions

1. **Monorepo & Cross-Platform Code Reuse**:
* Structured the repository into modular directories (`/mobile`, `/backend`, `/web`) to clearly separate client concerns from server infrastructure.
* Leveraged React Native for Web compatibility to maximize component sharing across mobile and browser clients.


2. **Apple-Native Aesthetic System**:
* Built custom UI primitives simulating iOS 18 design tokens, including a titanium iPhone frame geometry, edge-to-edge layout styling, and hardware-accurate Dynamic Island expanding notifications.
* Developed native vector component rendering for the Face ID authentication HUD, avoiding external heavy SVG bundling errors on the web.


3. **GraphQL API Layer**:
* Chose **Apollo Server** and GraphQL over traditional REST endpoints to enable precise, user-scoped data fetching (`getTodos`, `createTodo`, `deleteTodo`) and unified state mutations.



---

## ☁️ AWS Deployment Architecture Plan

For production scaling beyond local development, the backend follows this cloud roadmap:

1. **Compute Services**: Deploy the Node.js/GraphQL backend onto **AWS Lambda** via **Serverless Framework** (or **AWS App Runner** for simple containerized deployment using a `Dockerfile`).
2. **Database Persistence**: Shift local in-memory storage to **AWS DynamoDB** (NoSQL) or **Amazon RDS (PostgreSQL)** for secure, user-scoped data persistence.
3. **API Routing**: Expose the backend via **AWS API Gateway** linked directly to the Lambda function.
4. **Estimated Cost**: ~$0–$5/month under low traffic tiers (fully operating within AWS Free Tier limits).

---

## ⏱️ Time Taken

* **Backend Development (Node.js + Apollo):** ~1.5 hours
* **Mobile App & Apple UI System (React Native):** ~2 hours
* **Web App & Vercel Configuration:** ~1 hour
* **Cloud Architecture & Documentation:** ~1 hour
* **Total Development Time:** ~5.5 hours