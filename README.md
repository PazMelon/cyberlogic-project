# Cyberlogic Portal 🌐

Welcome to the official repository for the **Cyberlogic Club Portal**! This platform acts as the central hub for our university computer club, enabling students to explore club information, engage in discussions, collaborate via real-time chat, and manage operations through a customized officer dashboard.

This project is open-source and welcoming contributions from all Cyberlogic members! 🚀

---

## 🛠️ Tech Stack

- **Core**: React 19 (TypeScript), Vite
- **Styling**: TailwindCSS 4, CSS Custom Properties (Theme Tokens)
- **Icons**: Lucide React
- **Routing**: React Router 7

---

## 🌟 Key Features

### 💻 1. Interactive Landing Page & Hero CLI
- A simulated command-line interface directly on the hero banner.
- Allows students to interactively query club information, list active projects, or simulate terminal commands without leaving the page.
- Fully customizable CLI database file.

### 🔐 2. Split-Screen Authentication
- Split-screen sign-in and registration pages designed with cyber-aesthetics.
- Graceful "Back to Homescreen" navigation.

### 👥 3. Member Portal
- **Dashboard**: Home feed showcasing announcements, upcoming events, and resource links.
- **Forums**: Discussions categories with inline filter pills, search functionality, pinned threads, and solved status.
- **Real-Time Chat**: Docked edge-to-edge layout designed to prevent overlap and remain locked dynamically to the browser layout.
- **Directory**: Complete searchable, role-tagged, and status-supported list of club members.
- **Reddit-style Profile**: u/username profile card layout with custom banners, join date (Cake Day), user posts, and achievement badges.

### 🛡️ 4. Officer Admin Panel
- **Admin Dashboard**: Visual stats cards (members, threads, approvals) and recent activity stream.
- **Pending Approvals Queue**: Approve/reject new member requests.
- **Content Management**: Manage announcements, events, resources, and moderation controls for the community forum.
- **Live Theme Customizer**: Real-time theme editor where officers can adjust custom HSL variable colors (primary, accent, backgrounds) and preview changes instantly.

---

## 📂 Project Structure

```
cyberlogic-project/
├── cyberlogic-frontend/     # React + Vite + Tailwind frontend application
│   ├── src/
│   │   ├── components/      # Shared components (Sidebar, Topbar, CLI)
│   │   ├── context/         # Auth & global state management
│   │   ├── data/            # Mock database schemas and content configuration
│   │   ├── layouts/         # Layout shells (Public, Member Auth, Admin Layouts)
│   │   ├── pages/           # Pages (Forums, Directory, Admin Panel, Profile)
│   │   └── index.css        # Core stylesheet and Tailwind theme variables
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
Make sure you have Node.js installed (v18.x or higher recommended).

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/cyberlogic-project.git
   cd cyberlogic-project
   ```

2. **Navigate to the Frontend**:
   ```bash
   cd cyberlogic-frontend
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173` (or the port specified in terminal).

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🤝 Contribution Guidelines

All club members are welcome and encouraged to contribute! To get started:

1. **Find an Issue**: Check out the issues tab or ask an officer in the `#portal-dev` channel.
2. **Create a Branch**: Make your feature branch off `main` (e.g., `git checkout -b feature/amazing-feature`).
3. **Write Clean Code**: Follow TypeScript best practices, reuse variables defined in `index.css`, and avoid hardcoding values.
4. **Test Your Changes**: Verify that the project builds using `npm run build` with zero compiler errors.
5. **Open a Pull Request**: Provide a detailed description of your changes and tag a project maintainer for review.

---

## 🎨 Theme Customization

The portal uses CSS variables for styling. You can customize the look by changing the HSL custom properties under the `@theme` directive in `src/index.css` or using the **Site Settings** page inside the Admin panel:

```css
:root {
  --cl-primary: #06b6d4;      /* Cyan primary brand glow */
  --cl-accent: #a855f7;       /* Purple secondary accent */
  --cl-surface-950: #0a0e1a;  /* Cyber dark background */
}
```

---

*Made with 💻 & ☕ by the Cyberlogic Club developers.*
