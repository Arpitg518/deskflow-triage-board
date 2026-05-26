# DeskFlow — SLA Support Ticket Triage Board

[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/Arpitg518/deskflow-triage-board)

DeskFlow is a modern support ticket triage dashboard built on the MERN stack (MongoDB, Express, React, and Node.js). It is designed to help customer support agents visualizes operational workflows, track resolution targets, and ensure compliance with priority-based Service Level Agreements (SLAs).

---

## 🚀 Key Features

- **Workflow State Machine**: Strictly enforces ticket lifecycles. Tickets move sequentially through: `Open` ⇄ `In Progress` ⇄ `Resolved` ⇄ `Closed`. Invalid status transitions are rejected at the database controller level.
- **Dynamic SLA Triage**: Computes ticket ages and SLA breach flags on the fly at read-time, preventing clock drift inconsistencies.
  - **Urgent Priority**: 1-hour target.
  - **High Priority**: 4-hour target.
  - **Medium Priority**: 24-hour target.
  - **Low Priority**: 72-hour target.
- **Interactive Drag-and-Drop Board**: Agents can drag cards between columns with immediate visual validation. Valid drop targets turn green; invalid states trigger a shake animation and snap back with clear error notifications.
- **Real-Time Auto-polling**: Polls the server every 10 seconds to update open ticket durations and identify active SLA breaches without manual page refreshes.
- **Filters & Search Toolbar**: Search tickets in real-time by text (subject, description, customer email), filter by SLA breach status, select priorities, and sort by age or priority.
- **Granular Validations**: Highlights schema validation errors (such as invalid email formats or missing fields) directly under the corresponding form inputs.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, Mongoose (MongoDB ODM), Cors, Dotenv, Nodemon.
- **Frontend**: React (Vite-scaffolded), HTML5 Drag-and-Drop API, custom Vanilla CSS.
- **Hosting**: Netlify (Frontend) & Render/Railway (Backend).

---

## 📁 Repository Structure

```text
deskflow-triage-board/
├── backend/
│   ├── controllers/      # Business logic (transitions, SLA calculations, stats)
│   ├── models/           # Mongoose schemas & validators
│   ├── routes/           # Express endpoint mappings
│   ├── server.js         # Express server setup and DB connection
│   └── package.json
├── frontend/
│   ├── public/           # Static assets & Netlify redirection rules
│   ├── src/
│   │   ├── components/   # StatsStrip, Board, TicketCard, TicketForm
│   │   ├── App.jsx       # State coordinator & API client
│   │   ├── index.css     # Glassmorphic dark styling and animations
│   │   └── main.jsx      # React mounting entry point
│   ├── vite.config.js    # Dev proxies
│   └── package.json
└── README.md
```

---

## ⚙️ How to Run Locally

### 1. Prerequisite
- Make sure a local MongoDB instance is running at `mongodb://127.0.0.1:27017/`.

### 2. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
The server will connect to MongoDB and listen on port `5000` (`http://localhost:5000`).

### 3. Start the Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser. All requests to `/api/*` will automatically proxy to the backend server.

---

## 🧪 Operational Design Decisions

1. **In-Memory Dynamic Filtering**:
   Since the `slaBreached` status and `ageMinutes` of a ticket change continuously as time passes, storing these fields in the database leads to stale data. Instead, they are calculated relative to `createdAt`, `resolvedAt`, and the system clock (`new Date()`) at read-time on every query.
2. **Reverse Transition Handling**:
   When a ticket is moved backward past the `Resolved` state (e.g. from `Resolved` to `In Progress`), the backend automatically resets `resolvedAt = null`, allowing the SLA timer to resume ticking.
3. **Netlify Redirect Proxies**:
   To prevent CORS issues and avoid hardcoding localhost endpoints in the deployed build, a `_redirects` configuration maps `/api/*` requests to the live backend server.
