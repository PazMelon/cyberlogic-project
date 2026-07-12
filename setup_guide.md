# Cyberlogic Portal - Production & Realtime Setup Guide

This document describes how to configure and deploy the Node.js Realtime WebSocket service alongside the Laravel backend in a production environment using **Laragon (Apache)**, **Cloudflare Tunneling**, and the **AI Batch Moderation scheduler**.

---

## 1. System Architecture Overview

In production, the application runs on a host machine (e.g., Mini-PC) with the following structure:
- **Laravel Backend**: Runs on local port `80` (handled by Laragon Apache).
- **Node.js WebSocket Server**: Runs on local port `3001` (`cyberlogic-realtime`).
- **Cloudflare Tunnel**: Exposes the site securely to the internet (`https://cyberlogic.pazmelon.com`).
- **Apache Proxy Pass**: Configured only inside the project's VirtualHost block to route `/ws` path requests to port `3001` internally. This allows both HTTP and WebSocket traffic to share port `80/443` without opening extra port firewalls.
- **Background Scheduler**: A background loop executes Laravel's scheduler once every minute to trigger batch AI moderation tasks and cleanups.

---

## 2. Environment Configurations

### A. Laravel Backend (`cyberlogic-backend/.env`)
Verify the following environment keys are defined correctly in your production database/URL block:
```env
APP_NAME=Cyberlogic_Club
APP_ENV=production
APP_DEBUG=false
APP_URL=https://cyberlogic.pazmelon.com/

# Database Connection (Production DB name is 'cyberlogic')
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cyberlogic
DB_USERNAME=root
DB_PASSWORD=your_secure_password

# Secret token shared with Node WebSocket server for system broadcasts
REALTIME_WS_SECRET=secret_token_here

# Gemini API Integration for Message Moderation
GEMINI_API_KEY=your_actual_api_studio_key_here
GEMINI_VERSION=v1beta
GEMINI_MODEL=gemini-3.1-flash-lite
```
> [!IMPORTANT]
> The `GEMINI_API_KEY` is required for the batch AI moderation scanner to analyze flagged messages. Get a free API key from Google AI Studio.

### B. Realtime WebSocket Service (`cyberlogic-realtime/.env`)
Ensure database settings match Laravel's production parameters:
```env
WS_PORT=3001
LARAVEL_URL=http://127.0.0.1:8000
REALTIME_WS_SECRET=secret_token_here

# Database configuration matching Laravel
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cyberlogic
DB_USERNAME=root
DB_PASSWORD=your_secure_password
```

---

## 3. Windows & Laragon Background Scheduler (AI Moderation Setup)

The batch AI moderation pipeline runs automatically either when **50 messages** accumulate or **hourly** via the Laravel Task Scheduler. 

Because Windows does not support native Linux cron jobs, you must set up the Windows Task Runner loop to keep the scheduler running:

### Step 1: Locate the Batch Runner Script
In the root directory of the project, we have created the [run-scheduler.bat](file:///c:/laragon/www/cyberlogic-project/run-scheduler.bat) file. This script runs a lightweight infinite Command Prompt loop that triggers Laravel's scheduler once every 60 seconds and releases 100% of its memory after each execution to prevent memory leaks/bloat.

### Step 2: Set Up Automatic Boot Launch
To ensure the scheduler starts automatically if the Windows machine restarts:
1. Press `Win + R` on your keyboard.
2. Type `shell:startup` and press Enter to open the Windows Startup directory.
3. Right-click [run-scheduler.bat](file:///c:/laragon/www/cyberlogic-project/run-scheduler.bat), select **Create Shortcut**, and move the created shortcut into this Startup directory.
4. Keep the command prompt running on the desktop server. If the process terminates, it is self-healing and will automatically restart PHP on the next loop iteration.

---

## 4. Apache Configuration inside Laragon

To enable internal forwarding of WebSocket handshakes, you must turn on the proxy modules and add a proxy routing rule.

### Step 1: Enable Apache Modules
1. Open the **Laragon** control panel interface.
2. Click **Menu** -> **Apache** -> **Apache modules**.
3. Make sure the following modules are checked:
   * [x] `proxy_module`
   * [x] `proxy_wstunnel_module`

### Step 2: Add Proxy Rules to the VirtualHost Configuration
Open your Apache VirtualHost configuration file for the project (e.g., `C:/laragon/etc/apache2/sites-enabled/cyberlogic-project.conf` or inside your global `httpd-vhosts.conf` file).

Add the `ProxyPass` directives **inside** the `<VirtualHost *:80>` block of your ServerName to restrict it only to this project:

```apache
# ==============================
# Cyberlogic Club
# ==============================
<VirtualHost *:80>
    ServerName cyberlogic.pazmelon.com
    DocumentRoot "C:/laragon/www/cyberlogic/public"

    # Forward WebSocket upgrade handshakes to local Node.js port 3001
    ProxyPass /ws ws://127.0.0.1:3001/ws
    ProxyPassReverse /ws ws://127.0.0.1:3001/ws

    <Directory "C:/laragon/www/cyberlogic/public">
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog "logs/cyberlogic-error.log"
    CustomLog "logs/cyberlogic-access.log" combined
</VirtualHost>
```

4. **Restart Apache** inside the Laragon control panel (**Stop** then **Start**).

---

## 5. Troubleshooting Checklists

### 1. "Unexpected token < in JSON at position 0"
* **Reason**: The WebSocket auth fallback fetched an HTML page (like a login or 404 page) instead of a JSON response.
* **Fix**: Ensure Apache modules (`proxy_module` & `proxy_wstunnel_module`) are active, and check that the VirtualHost ServerName definition matches `cyberlogic.pazmelon.com`.

### 2. "Ticket verification failed"
* **Reason**: Database mismatch or timezone drift.
* **Fix**: Make sure `DB_DATABASE` is set to `cyberlogic` in both `.env` files. Ensure the host system clocks match or NTP time sync is enabled.

### 3. Service starts then crashes immediately
* **Reason**: Port `3001` is already in use by another running Node process.
* **Fix**: Kill previous Node instances using Task Manager or run `Stop-Process` on Windows PowerShell.

### 4. Uploaded files (avatars, announcement images) return 404
* **Reason**: The public storage symbolic link (`public/storage`) is missing, broken, or misconfigured in production.
* **Fix**: Regenerate the link inside `cyberlogic-backend`:
  ```bash
  php artisan storage:link
  ```
