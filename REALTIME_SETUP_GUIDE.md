# Cyberlogic Realtime Service - Production Setup Guide

This document describes how to configure and deploy the Node.js Realtime WebSocket service alongside the Laravel backend in a production environment using **Laragon (Apache)** and **Cloudflare Tunneling**.

---

## 1. System Architecture Overview

In production, the application runs on a host machine (e.g., Mini-PC) with the following structure:
- **Laravel Backend**: Runs on local port `80` (handled by Laragon Apache).
- **Node.js WebSocket Server**: Runs on local port `3001` (`cyberlogic-realtime`).
- **Cloudflare Tunnel**: Exposes the site securely to the internet (`https://cyberlogic.pazmelon.com`).
- **Apache Proxy Pass**: Configured only inside the project's VirtualHost block to route `/ws` path requests to port `3001` internally. This allows both HTTP and WebSocket traffic to share port `80/443` without opening extra port firewalls.

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
REALTIME_WS_SECRET=cyberlogic_secret_token_123
```

### B. Realtime WebSocket Service (`cyberlogic-realtime/.env`)
Ensure database settings match Laravel's production parameters:
```env
WS_PORT=3001
LARAVEL_URL=http://127.0.0.1:8000
REALTIME_WS_SECRET=cyberlogic_secret_token_123

# Database configuration matching Laravel
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cyberlogic
DB_USERNAME=root
DB_PASSWORD=your_secure_password
```
> [!NOTE]
> The `LARAVEL_URL` points to `http://127.0.0.1:8000` by default to preserve the local development workspace, but our code dynamically overrides this to port `80` with virtual host headers when it detects production traffic.

### C. Local Development Environment Configurations

Below are the exact development variables currently configured on the repository:

#### 1. Laravel Backend Development (`cyberlogic-backend/.env`)
```env
APP_NAME=Laravel
APP_ENV=local
APP_KEY=base64:8ChsubzoTws7dtxo2ZWj8CpAuzJNGlDT/Gsctyo8fd0=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cyberlogic-backend
DB_USERNAME=root
DB_PASSWORD=e57!@HJpANqqb92*

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

REALTIME_WS_SECRET=cyberlogic_secret_token_123
```

#### 2. Realtime WebSocket Service Development (`cyberlogic-realtime/.env`)
```env
WS_PORT=3001
LARAVEL_URL=http://127.0.0.1:8000
REALTIME_WS_SECRET=cyberlogic_secret_token_123

# Database configuration (matching development Laravel)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cyberlogic-backend
DB_USERNAME=root
DB_PASSWORD=e57!@HJpANqqb92*
```

---

## 3. Apache Configuration inside Laragon

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

## 4. Key Design Implementation Details

Our code incorporates several custom solutions to make production hosting through Cloudflare Tunnels smooth:

### A. Dynamic Host Authentication Header Routing
In production, Cloudflare requests come to Laragon Apache, which routes based on name-based hosting. We forward the `Host` header to ensure Apache directs the verification request to the correct site:
```javascript
// From cyberlogic-realtime/src/auth.js
const hostHeader = req.headers.host || '';
const laravelTargetUrl = hostHeader.includes('cyberlogic.pazmelon.com')
  ? 'http://127.0.0.1:80'
  : DEFAULT_LARAVEL_URL;

const requestHeaders = {
  'Accept': 'application/json',
  'Cookie': rawCookies,
};
if (hostHeader.includes('cyberlogic.pazmelon.com')) {
  requestHeaders['Host'] = 'cyberlogic.pazmelon.com';
}
```

### B. Timezone Offset / Clock Drift Immunity
To prevent ticket verification from failing due to clock drift or timezone differences between the MySQL database and PHP/Laravel, the ticket query allows a 24-hour buffer:
```javascript
const dbUserExpires = new Date(dbUser.expires_at).getTime();
const currentSystemTime = new Date().getTime();
if (dbUserExpires < currentSystemTime - (24 * 60 * 60 * 1000)) {
  // Ticket is older than 24h
}
```

### C. Relative WebSocket URL
The frontend uses a relative WebSocket URL structure so it automatically inherits HTTP/HTTPS protocol handshakes seamlessly across local development and production domains:
```typescript
// From cyberlogic-frontend/src/utils/websocket.ts
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
this.url = `${protocol}//${window.location.host}/ws`;
```

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
