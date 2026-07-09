# Cyberlogic Portal 🌐

Welcome to the official repository for the **Cyberlogic Club Portal**! This platform acts as the central hub for our university computer club, enabling students to explore club information, engage in discussions, collaborate via real-time chat, and manage operations through a customized officer dashboard.

This project is open-source and welcoming contributions from all Cyberlogic members! 🚀

---

## 🛠️ Full-Stack Architecture

The Cyberlogic Club Portal is built as a distributed full-stack application comprising three core modules:

1. **Frontend (`cyberlogic-frontend`)**:
   - Built with **React 19 (TypeScript)**, **Vite**, and **TailwindCSS 4**.
   - Fully interactive user interface including the home dashboard, forums, dynamic theme customizer, officer panel, and live chat.
2. **Backend (`cyberlogic-backend`)**:
   - Powered by **Laravel (PHP)** providing a RESTful API.
   - Manages user authentication, membership queues, roles, forum categories, threads, and message persistence in a **MySQL** database.
3. **Realtime Service (`cyberlogic-realtime`)**:
   - A lightweight **Node.js** WebSocket server built using the `ws` library.
   - Interacts with MySQL and the Laravel backend to broadcast real-time events (new chat messages, typing indicators, and message reactions) instantly to active users.

```
                  ┌───────────────────────────────┐
                  │   React Frontend (Port 5173)  │
                  └──────┬─────────────────┬──────┘
                         │                 │
              REST APIs  │                 │  WebSockets
              (Port 8000)│                 │  (Port 3001)
                         ▼                 ▼
             ┌──────────────────┐    ┌──────────────────┐
             │  Laravel Backend ├────► Realtime Service  │
             └──────────┬───────┘    └─────────┬────────┘
                        │                      │
                        │      MySQL DB        │
                        └──────────┬───────────┘
                                   ▼
                       ┌──────────────────────┐
                       │  Database (3306)     │
                       └──────────────────────┘
```

---

## 🌟 Key Features

### 💻 1. Interactive Landing Page & Hero CLI
- A simulated command-line interface directly on the hero banner.
- Allows students to interactively query club information, list active projects, or simulate terminal commands without leaving the page.
- Dynamic officer bios showing detailed profiles of the club's administration.
- Fully customizable CLI database file.

### 👥 2. Member Portal
- **Dashboard**: Home feed showcasing announcements, upcoming events, and resource links.
- **Forums**: Complete discussions module featuring forum thread CRUD (create, read, update, delete) operations, thread pinning, solved/unsolved status indicators, full interactive poll creation & voting, inline filter pills, search filtering, and XSS sanitization.
- **Real-Time Chat**: Docked edge-to-edge layout designed to prevent overlap and remain locked dynamically to the browser layout, featuring typing indicators and live emoji reactions.
- **Directory**: Complete searchable, role-tagged, and status-supported list of club members.
- **Reddit-style Profile**: u/username profile card layout with custom banners, join date (Cake Day), user posts, and achievement badges, fully integrated with thread author views.

### 🛡️ 3. Officer Admin Panel & CMS
- **Admin Dashboard**: Visual stats cards (members, threads, approvals) and recent activity stream.
- **Centralized CMS Content Management**: Full CRUD infrastructure for announcements, events, and blog posts with builder utilities, user ownership tracking (with migrations adding `user_id` foreign keys), and rich author-attributed details.
- **Member Management**: Console allowing admin officers to assign roles, approve or reject registrations from the queue, and suspend/unsuspend members.
- **Live Theme Customizer & Site Settings**: Real-time theme editor where officers can adjust custom HSL variable colors (primary, accent, backgrounds) and save the configuration profiles directly to the backend database.

---

## 📂 Project Structure

```
cyberlogic-project/
├── cyberlogic-backend/      # Laravel PHP API backend
│   ├── app/                 # Controllers, Models, Middleware
│   ├── database/            # Migrations, seeders, and factories
│   └── routes/              # API routes configuration
├── cyberlogic-frontend/     # React + Vite + Tailwind CSS v4 frontend
│   ├── src/
│   │   ├── components/      # Shared UI (Sidebar, CLI, Chat, Reactions)
│   │   ├── context/         # Auth & WebSocket context providers
│   │   └── pages/           # Pages (Dashboard, Forums, Profile, Admin)
├── cyberlogic-realtime/     # Node.js WebSocket service
│   └── src/                 # Server logic, connection handling, database helpers
├── README.md                # Main project overview & developer startup guide
└── REALTIME_SETUP_GUIDE.md  # Production deploy & Cloudflare tunnel guide
```

---

## 🚀 Getting Started

Follow these instructions to set up and run the entire suite locally.

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v18.x or higher)
- **PHP** (v8.2 or higher) & **Composer**
- **MySQL** (v8.0 or higher) / **Laragon** (recommended for Windows users)

---

### 1. Backend Setup (`cyberlogic-backend`)

1. **Navigate to the Backend Directory**:
   ```bash
   cd cyberlogic-backend
   ```
2. **Install Composer Dependencies**:
   ```bash
   composer install
   ```
3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure your database settings:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=cyberlogic-backend
   DB_USERNAME=root
   DB_PASSWORD=your_secure_password
   ```
   *Note: Ensure `REALTIME_WS_SECRET` matches between the Backend and Realtime services.*
4. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```
5. **Run Migrations & Seed Database**:
   ```bash
   php artisan migrate --seed
   ```
6. **Start the Laravel Dev Server**:
   ```bash
   php artisan serve
   ```
   The backend API will run on `http://127.0.0.1:8000`.

---

### 2. Realtime Service Setup (`cyberlogic-realtime`)

1. **Navigate to the Realtime Directory**:
   ```bash
   cd ../cyberlogic-realtime
   ```
2. **Install Node Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Ensure the database credentials match the Laravel backend configurations, and point `LARAVEL_URL` to `http://127.0.0.1:8000`.
4. **Start the WebSocket Server**:
   ```bash
   npm run dev
   ```
   The WebSocket server will start on port `3001` (`ws://localhost:3001`).

---

### 3. Frontend Setup (`cyberlogic-frontend`)

1. **Navigate to the Frontend Directory**:
   ```bash
   cd ../cyberlogic-frontend
   ```
2. **Install Node Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file or configure your local settings if needed to reference the backend API (`http://localhost:8000/api`) and the WebSocket server (`ws://localhost:3001`).
4. **Start the Frontend Application**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🎨 Theme Customization

The portal uses CSS variables for styling. You can customize the look by changing the HSL custom properties under the `@theme` directive in `cyberlogic-frontend/src/index.css` or using the **Site Settings** page inside the Admin panel:

```css
:root {
  --cl-primary: #06b6d4;      /* Cyan primary brand glow */
  --cl-accent: #a855f7;       /* Purple secondary accent */
  --cl-surface-950: #0a0e1a;  /* Cyber dark background */
}
```

---

## 🌐 Production & Advanced Deployments

For hosting the portal in a production environment with a Cloudflare tunnel and Apache proxy pass routing, please consult the detailed instructions in [REALTIME_SETUP_GUIDE.md](file:///c:/laragon/www/cyberlogic-project/REALTIME_SETUP_GUIDE.md).

---

*Made with 💻 & ☕ by the Cyberlogic Club developers.*
