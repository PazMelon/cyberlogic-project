const cookie = require('cookie');
require('dotenv').config();

const LARAVEL_URL = process.env.LARAVEL_URL || 'http://127.0.0.1:8000';

/**
 * Verify user session with the Laravel backend.
 * 
 * @param {object} req Incoming HTTP upgrade request
 * @returns {Promise<object|null>} User object if valid, null otherwise
 */
async function verifySession(req) {
  try {
    const rawCookies = req.headers.cookie;
    if (!rawCookies) {
      console.log('[Auth] Connection rejected: No cookies present');
      return null;
    }

    // Call Laravel's user endpoint, forwarding the cookies
    const response = await fetch(`${LARAVEL_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': rawCookies,
      },
    });

    if (!response.ok) {
      console.log(`[Auth] Connection rejected: Laravel returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data && data.user) {
      console.log(`[Auth] User authenticated successfully: ${data.user.name} (${data.user.role})`);
      return data.user;
    }

    console.log('[Auth] Connection rejected: Laravel user payload empty');
    return null;
  } catch (err) {
    console.error('[Auth] Error verifying session:', err.message);
    return null;
  }
}

module.exports = { verifySession };
