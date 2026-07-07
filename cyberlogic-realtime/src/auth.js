const url = require('url');
require('dotenv').config();
const pool = require('./db');

const LARAVEL_URL = process.env.LARAVEL_URL || 'http://127.0.0.1:8000';

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
      console.log(`[Auth] Verifying connection ticket: ${ticket.substring(0, 8)}...`);
      
      const [rows] = await pool.query(
        `SELECT u.id, u.first_name, u.middle_name, u.last_name, u.role, u.avatar_path 
         FROM chat_tickets t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.ticket = ? AND t.expires_at > NOW() 
         LIMIT 1`,
        [ticket]
      );

      if (rows.length > 0) {
        const dbUser = rows[0];
        const middlePart = dbUser.middle_name ? `${dbUser.middle_name} ` : '';
        const fullName = `${dbUser.first_name} ${middlePart}${dbUser.last_name}`.trim();
        
        const avatar = dbUser.avatar_path 
          ? `/storage/${dbUser.avatar_path}` 
          : `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(dbUser.first_name)}`;

        const user = {
          id: dbUser.id,
          first_name: dbUser.first_name,
          middle_name: dbUser.middle_name,
          last_name: dbUser.last_name,
          name: fullName,
          role: dbUser.role,
          avatar: avatar
        };

        console.log(`[Auth] Ticket verified successfully: ${user.name} (ID: ${user.id})`);
        
        // Delete ticket (one-time use token)
        await pool.query('DELETE FROM chat_tickets WHERE ticket = ?', [ticket]);
        
        return user;
      }

      console.log('[Auth] Ticket verification failed: Invalid or expired ticket');
    }

    // 2. Fallback to Cookie-Based Session Auth (for backwards compatibility)
    const rawCookies = req.headers.cookie;
    if (!rawCookies) {
      console.log('[Auth] Connection rejected: No credentials provided (no ticket/cookies)');
      return null;
    }

    console.log('[Auth] Falling back to cookie-based session verification...');
    const response = await fetch(`${LARAVEL_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': rawCookies,
      },
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
