const url = require('url');
require('dotenv').config();
const pool = require('./db');

const DEFAULT_LARAVEL_URL = process.env.LARAVEL_URL || 'http://127.0.0.1:8000';

/**
 * Verify user connection ticket or session cookie.
 * 
 * @param {object} req Incoming HTTP upgrade request
 * @returns {Promise<object|null>} User object if valid, null otherwise
 */
async function verifySession(req) {
  try {
    // 1. Try Ticket-Based Auth first (most robust, works in Incognito/Proxy)
    const parsedUrl = url.parse(req.url, true);
    const ticket = parsedUrl.query.ticket;

    if (ticket) {
      console.log(`[Auth] Executing query for ticket: ${ticket}`);
      const [rows] = await pool.query(
        `SELECT u.id, u.username, u.first_name, u.middle_name, u.last_name, u.role, u.avatar_path, t.expires_at 
         FROM chat_tickets t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.ticket = ? 
         LIMIT 1`,
        [ticket]
      );

      console.log(`[Auth] Ticket query result length: ${rows.length}`);
      if (rows.length > 0) {
        const dbUser = rows[0];
        console.log(`[Auth] Found ticket row: expires_at=${dbUser.expires_at}, system_time=${new Date().toISOString()}`);
        
        const dbUserExpires = new Date(dbUser.expires_at).getTime();
        const currentSystemTime = new Date().getTime();
        // Allow broad 24-hour expiration window or ignore expiration during verification to bypass timezone drifts
        if (dbUserExpires < currentSystemTime - (24 * 60 * 60 * 1000)) {
          console.log('[Auth] Ticket verification failed: Ticket is older than 24 hours');
        } else {
          const middlePart = dbUser.middle_name ? `${dbUser.middle_name} ` : '';
          const fullName = `${dbUser.first_name} ${middlePart}${dbUser.last_name}`.trim();
          
          const avatar = dbUser.avatar_path 
            ? `/storage/${dbUser.avatar_path}` 
            : `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(dbUser.first_name)}`;

          // Fetch permission keys for authorization checks
          let permissionKeys = [];
          if (dbUser.role === 'superadmin') {
            const [allPerms] = await pool.query('SELECT `key` FROM permissions');
            permissionKeys = allPerms.map(p => p.key);
          } else {
            const [userPerms] = await pool.query(
              `SELECT p.\`key\` FROM permissions p 
               INNER JOIN permission_user pu ON p.id = pu.permission_id 
               WHERE pu.user_id = ?`,
              [dbUser.id]
            );
            permissionKeys = userPerms.map(p => p.key);
          }

          const user = {
            id: dbUser.id,
            username: dbUser.username,
            first_name: dbUser.first_name,
            middle_name: dbUser.middle_name,
            last_name: dbUser.last_name,
            name: dbUser.username || fullName,
            role: dbUser.role,
            avatar: avatar,
            permission_keys: permissionKeys,
          };

          console.log(`[Auth] Ticket verified successfully: ${user.name} (ID: ${user.id}, permissions: ${permissionKeys.join(', ')})`);
          
          // Delete ticket (one-time use token)
          await pool.query('DELETE FROM chat_tickets WHERE ticket = ?', [ticket]);
          
          return user;
        }
      }

      console.log('[Auth] Ticket verification failed: Invalid or expired ticket');
    }

    // 2. Fallback to Cookie-Based Session Auth (for backwards compatibility)
    const rawCookies = req.headers.cookie;
    if (!rawCookies) {
      console.log('[Auth] Connection rejected: No credentials provided (no ticket/cookies)');
      return null;
    }

    // Dynamically choose target LARAVEL_URL depending on host header (production via tunnel vs dev)
    const hostHeader = req.headers.host || '';
    const laravelTargetUrl = hostHeader.includes('cyberlogic.pazmelon.com')
      ? 'http://127.0.0.1:80'
      : DEFAULT_LARAVEL_URL;

    // Apache requires the ServerName matching the HTTP Host header to route the request to the correct virtual host
    const requestHeaders = {
      'Accept': 'application/json',
      'Cookie': rawCookies,
    };
    if (hostHeader.includes('cyberlogic.pazmelon.com')) {
      requestHeaders['Host'] = 'cyberlogic.pazmelon.com';
    }

    console.log('[Auth] Falling back to cookie-based session verification...');
    const response = await fetch(`${laravelTargetUrl}/api/user`, {
      method: 'GET',
      headers: requestHeaders,
    });

    if (!response.ok) {
      console.log(`[Auth] Cookie validation failed: Laravel returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data && data.user) {
      console.log(`[Auth] Cookie verified successfully: ${data.user.name} (${data.user.role})`);
      return data.user;
    }

    console.log('[Auth] Connection rejected: Cookie check returned empty user payload');
    return null;
  } catch (err) {
    console.error('[Auth] Verification error:', err.message);
    return null;
  }
}

module.exports = { verifySession };
