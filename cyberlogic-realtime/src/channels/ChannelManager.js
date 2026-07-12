const pool = require('../db');
const ActivityTracker = require('./ActivityTracker');

class ChannelManager {
  constructor() {
    // Maps channelName -> Set of WebSocket clients
    this.channels = new Map();
    // Maps client -> Set of channelNames subscribed
    this.clientSubscriptions = new Map();
    // Maps userId -> Set of WebSocket clients (handles multi-tab connections)
    this.onlineUsers = new Map();
    // Maps client -> user object
    this.clientUsers = new Map();
    // Anti-spam: Maps userId -> array of message timestamps (sliding window)
    this.messageTimestamps = new Map();
    // Rate limit: 15 messages per 60 seconds
    this.RATE_LIMIT_MAX = 15;
    this.RATE_LIMIT_WINDOW_MS = 60 * 1000;
    
    // Initialize presence log bot activity tracker
    this.activityTracker = new ActivityTracker(this);
  }

  /**
   * Register a connection and update presence.
   */
  registerClient(client, user) {
    this.clientUsers.set(client, user);
    this.clientSubscriptions.set(client, new Set());

    if (!this.onlineUsers.has(user.id)) {
      this.onlineUsers.set(user.id, {
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
        clients: new Set(),
      });
      // Broadcast updated presence
      this.broadcastPresence();

      // Trigger presence log bot connection
      this.activityTracker.onUserConnect(user);
    }
    this.onlineUsers.get(user.id).clients.add(client);
  }

  /**
   * Clean up connection subscriptions and presence.
   */
  unregisterClient(client) {
    const user = this.clientUsers.get(client);
    const subs = this.clientSubscriptions.get(client);

    if (subs) {
      for (const channelName of subs) {
        this.unsubscribe(client, channelName);
      }
    }

    this.clientSubscriptions.delete(client);
    this.clientUsers.delete(client);

    if (user && this.onlineUsers.has(user.id)) {
      const userPresence = this.onlineUsers.get(user.id);
      userPresence.clients.delete(client);

      if (userPresence.clients.size === 0) {
        this.onlineUsers.delete(user.id);
        // Broadcast updated presence
        this.broadcastPresence();

        // Trigger presence log bot disconnection
        this.activityTracker.onUserDisconnect(user);
      }
    }
  }

  /**
   * Subscribe client to a channel.
   */
  subscribe(client, channelName) {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new Set());
    }
    this.channels.get(channelName).add(client);
    this.clientSubscriptions.get(client).add(channelName);
    console.log(`[WS] Client subscribed to channel: ${channelName}`);
  }

  /**
   * Unsubscribe client from a channel.
   */
  unsubscribe(client, channelName) {
    if (this.channels.has(channelName)) {
      const clients = this.channels.get(channelName);
      clients.delete(client);
      if (clients.size === 0) {
        this.channels.delete(channelName);
      }
    }
    if (this.clientSubscriptions.has(client)) {
      this.clientSubscriptions.get(client).delete(channelName);
    }
    console.log(`[WS] Client unsubscribed from channel: ${channelName}`);
  }

  /**
   * Broadcast a payload to all subscribers of a channel.
   */
  broadcast(channelName, type, payload) {
    if (!this.channels.has(channelName)) return;

    const message = JSON.stringify({
      type,
      channel: channelName,
      payload,
    });

    const clients = this.channels.get(channelName);
    for (const client of clients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    }
  }

  /**
   * Send a message to a single client.
   */
  sendToClient(client, channel, type, payload) {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type,
        channel,
        payload,
      }));
    }
  }

  /**
   * Send a message to all clients of a specific user ID.
   */
  sendToUser(userId, channel, type, payload) {
    const userPresence = this.onlineUsers.get(Number(userId));
    if (userPresence && userPresence.clients) {
      const message = JSON.stringify({
        type,
        channel,
        payload,
      });
      for (const client of userPresence.clients) {
        if (client.readyState === 1) {
          client.send(message);
        }
      }
    }
  }

  /**
   * Broadcast presence update to all connected clients.
   */
  broadcastPresence() {
    const presenceList = Array.from(this.onlineUsers.values()).map(p => ({
      ...p.user,
      status: p.user.status || 'online',
    }));

    const message = JSON.stringify({
      type: 'presence',
      channel: 'presence',
      payload: presenceList,
    });

    for (const client of this.clientUsers.keys()) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  }

  /**
   * Handle incoming message from client.
   */
  async handleMessage(client, data) {
    const user = this.clientUsers.get(client);
    if (!user) return;

    try {
      const parsed = JSON.parse(data);
      const { type, channel, payload } = parsed;

      console.log(`[WS] Received: ${type} on ${channel}`);

      if (type === 'subscribe') {
        // Enforce allowed_roles authorization for chat channels
        if (channel.startsWith('chat:')) {
          const channelSlug = channel.split(':')[1];
          const [channels] = await pool.query('SELECT allowed_roles FROM chat_channels WHERE slug = ? LIMIT 1', [channelSlug]);
          if (channels.length > 0) {
            const allowed = channels[0].allowed_roles;
            let allowedRoles = typeof allowed === 'string' ? JSON.parse(allowed) : allowed;
            if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
              console.log(`[WS] Subscription rejected: User ${user.name} (${user.role}) not allowed in ${channel}`);
              this.sendToClient(client, channel, 'subscription_error', { message: 'Not allowed to view this channel.' });
              return;
            }
          }
        }

        this.subscribe(client, channel);
        if (channel === 'presence') {
          const presenceList = Array.from(this.onlineUsers.values()).map(p => ({
            ...p.user,
            status: p.user.status || 'online',
          }));
          this.sendToClient(client, 'presence', 'presence', presenceList);
        }
        // If subscribing to chat, send success ack or do setup
        if (channel.startsWith('chat:')) {
          this.sendToClient(client, channel, 'subscribe_success', { channel });
        }
      } else if (type === 'status_update') {
        const { status } = payload;
        if (status === 'online' || status === 'away') {
          const userPresence = this.onlineUsers.get(user.id);
          if (userPresence) {
            userPresence.user.status = status;
            this.broadcastPresence();
          }
        }
      } else if (type === 'unsubscribe') {
        this.unsubscribe(client, channel);
      } else if (type === 'message') {
        // Handle chat channel messages
        if (channel.startsWith('chat:')) {
          const channelSlug = channel.split(':')[1];
          await this.handleChatMessage(client, user, channelSlug, payload);
        }
      } else if (type === 'reaction') {
        // Handle chat reaction
        if (channel.startsWith('chat:')) {
          const channelSlug = channel.split(':')[1];
          await this.handleChatReaction(client, user, channelSlug, payload);
        }
      } else if (type === 'typing') {
        // Handle user typing state
        if (channel.startsWith('chat:')) {
          const channelSlug = channel.split(':')[1];
          await this.handleChatTyping(client, user, channelSlug, payload);
        }
      } else if (type === 'delete_message') {
        // Handle admin message deletion
        if (channel.startsWith('chat:')) {
          const channelSlug = channel.split(':')[1];
          await this.handleDeleteMessage(client, user, channelSlug, payload);
        }
      }
    } catch (err) {
      console.error('[WS] Error handling message:', err.message);
      this.sendToClient(client, 'error', 'error', { message: 'Invalid payload or server error.' });
    }
  }

  /**
   * Check anti-spam rate limit for a user. Returns true if allowed, false if rate-limited.
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW_MS;

    if (!this.messageTimestamps.has(userId)) {
      this.messageTimestamps.set(userId, []);
    }

    const timestamps = this.messageTimestamps.get(userId);
    // Prune old timestamps outside the sliding window
    while (timestamps.length > 0 && timestamps[0] < windowStart) {
      timestamps.shift();
    }

    if (timestamps.length >= this.RATE_LIMIT_MAX) {
      return false; // Rate limited
    }

    timestamps.push(now);
    return true; // Allowed
  }

  /**
   * Create and deliver notification.
   */
  async createNotification(userId, type, title, body, icon, link, data) {
    try {
      const [result] = await pool.query(
        'INSERT INTO notifications (user_id, type, title, body, icon, link, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [userId, type, title, body, icon, link, JSON.stringify(data || null)]
      );
      
      const notif = {
        id: result.insertId,
        user_id: userId,
        type,
        title,
        body,
        icon,
        link,
        data,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.sendToUser(userId, 'notifications', 'new_notification', notif);
      return notif;
    } catch (err) {
      console.error('[WS] Error creating notification:', err.message);
      return null;
    }
  }

  /**
   * Save and broadcast chat message.
   */
  async handleChatMessage(client, user, channelSlug, payload) {
    const { content, parentId } = payload;
    if (!content || !content.trim()) return;

    try {
      // Anti-spam rate limit check
      if (!this.checkRateLimit(user.id)) {
        console.log(`[WS] Rate limit hit: User ${user.name} (ID: ${user.id}) exceeded ${this.RATE_LIMIT_MAX} messages per minute`);
        this.sendToClient(client, `chat:${channelSlug}`, 'rate_limit', {
          message: `You're sending messages too fast. Please wait before sending another message. (Limit: ${this.RATE_LIMIT_MAX} messages per minute)`
        });
        return;
      }

      // 1. Get channel ID, name and write_roles from DB
      const [channels] = await pool.query('SELECT id, name, write_roles FROM chat_channels WHERE slug = ? LIMIT 1', [channelSlug]);
      if (channels.length === 0) {
        throw new Error(`Channel ${channelSlug} not found in database`);
      }
      const channelId = channels[0].id;
      const write = channels[0].write_roles;
      let writeRoles = typeof write === 'string' ? JSON.parse(write) : write;

      // Check write permissions
      if (writeRoles && Array.isArray(writeRoles) && !writeRoles.includes(user.role)) {
        console.log(`[WS] Message rejected: User ${user.name} (${user.role}) cannot write to ${channelSlug}`);
        this.sendToClient(client, `chat:${channelSlug}`, 'write_error', { message: 'You do not have permission to write in this channel.' });
        return;
      }

      // 2. Persist message to DB
      const [result] = await pool.query(
        'INSERT INTO chat_messages (channel_id, user_id, parent_id, content, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [channelId, user.id, parentId || null, content, 'text']
      );

      // 3. Format message payload to send
      let replyTo = null;
      let parentAuthorId = null;
      if (parentId) {
        const [parentMsg] = await pool.query(
          `SELECT m.id, m.content, m.user_id,
                  COALESCE(u.username, TRIM(CONCAT(u.first_name, ' ', IFNULL(CONCAT(u.middle_name, ' '), ''), u.last_name))) as author,
                  u.username as authorUsername
           FROM chat_messages m 
           LEFT JOIN users u ON m.user_id = u.id 
           WHERE m.id = ? LIMIT 1`,
          [parentId]
        );
        if (parentMsg.length > 0) {
          replyTo = {
            id: parentMsg[0].id,
            content: parentMsg[0].content,
            author: parentMsg[0].author || 'Anonymous',
            authorUsername: parentMsg[0].authorUsername || null,
          };
          parentAuthorId = parentMsg[0].user_id;
        }
      }

      const formattedMsg = {
        id: result.insertId,
        channelId: channelSlug,
        author: user.name,
        authorAvatar: user.avatar,
        authorId: user.id,
        authorUsername: user.username || null,
        content: content,
        timestamp: new Date().toISOString(),
        isSystem: false,
        replyTo: replyTo,
      };

      // 4. Broadcast message to the channel subscribers
      this.broadcast(`chat:${channelSlug}`, 'message', formattedMsg);

      const channelName = channels[0].name;

      // 5. Send notification for reply
      if (parentAuthorId && parentAuthorId !== user.id) {
        await this.createNotification(
          parentAuthorId,
          'chat_reply',
          'Chat Reply',
          `${user.name} replied to your message in #${channelName}`,
          'reply',
          `/app/chat?channel=${channelSlug}&message_id=${result.insertId}`,
          { channel_slug: channelSlug, message_id: result.insertId, parent_id: parentId }
        );
      }

      // 6. Send notification for mentions (individual & group mentions)
      const notifiedUserIds = new Set();
      if (parentAuthorId && parentAuthorId !== user.id) {
        notifiedUserIds.add(parentAuthorId);
      }

      const hasEveryone = content.includes('@everyone');
      const hasOfficers = content.includes('@officers');
      const hasFirstYear = content.includes('@firstyear');
      const hasSecondYear = content.includes('@secondyear');
      const hasThirdYear = content.includes('@thirdyear');
      const hasFourthYear = content.includes('@fourthyear');
      const hasFifthYear = content.includes('@fifthyear');
      const hasGraduate = content.includes('@graduate');

      const mentionTargetUserIds = new Set();

      if (hasEveryone) {
        const [users] = await pool.query('SELECT id FROM users WHERE status = ? AND id != ?', ['approved', user.id]);
        users.forEach(u => mentionTargetUserIds.add(u.id));
      } else {
        if (hasOfficers) {
          const [users] = await pool.query('SELECT id FROM users WHERE role IN (?, ?) AND status = ? AND id != ?', ['admin', 'superadmin', 'approved', user.id]);
          users.forEach(u => mentionTargetUserIds.add(u.id));
        }
        if (hasFirstYear) {
          const [users] = await pool.query('SELECT id FROM users WHERE year_level = ? AND status = ? AND id != ?', ['1st Year', 'approved', user.id]);
          users.forEach(u => mentionTargetUserIds.add(u.id));
        }
        if (hasSecondYear) {
          const [users] = await pool.query('SELECT id FROM users WHERE year_level = ? AND status = ? AND id != ?', ['2nd Year', 'approved', user.id]);
          users.forEach(u => mentionTargetUserIds.add(u.id));
        }
        if (hasThirdYear) {
          const [users] = await pool.query('SELECT id FROM users WHERE year_level = ? AND status = ? AND id != ?', ['3rd Year', 'approved', user.id]);
          users.forEach(u => mentionTargetUserIds.add(u.id));
        }
        if (hasFourthYear) {
          const [users] = await pool.query('SELECT id FROM users WHERE year_level = ? AND status = ? AND id != ?', ['4th Year', 'approved', user.id]);
          users.forEach(u => mentionTargetUserIds.add(u.id));
        }
        if (hasFifthYear) {
          const [users] = await pool.query('SELECT id FROM users WHERE year_level = ? AND status = ? AND id != ?', ['5th Year', 'approved', user.id]);
          users.forEach(u => mentionTargetUserIds.add(u.id));
        }
        if (hasGraduate) {
          const [users] = await pool.query('SELECT id FROM users WHERE year_level = ? AND status = ? AND id != ?', ['Graduate', 'approved', user.id]);
          users.forEach(u => mentionTargetUserIds.add(u.id));
        }
      }

      // Individual user mentions parsing
      const mentionRegex = /@([a-zA-Z0-9_\-\.]+)/g;
      const mentionedUsernames = [];
      let match;
      while ((match = mentionRegex.exec(content)) !== null) {
        const name = match[1].toLowerCase();
        if (!['everyone', 'officers', 'firstyear', 'secondyear', 'thirdyear', 'fourthyear', 'fifthyear', 'graduate'].includes(name)) {
          mentionedUsernames.push(match[1]);
        }
      }
      const uniqueUsernames = [...new Set(mentionedUsernames)];
      if (uniqueUsernames.length > 0) {
        const [mentionedUsers] = await pool.query(
          'SELECT id FROM users WHERE username IN (?) AND status = ? AND id != ?',
          [uniqueUsernames, 'approved', user.id]
        );
        mentionedUsers.forEach(u => mentionTargetUserIds.add(u.id));
      }

      // Deliver notifications to all targets (excluding those already notified via reply / sender)
      for (const targetId of mentionTargetUserIds) {
        if (!notifiedUserIds.has(targetId)) {
          await this.createNotification(
            targetId,
            'chat_mention',
            'New Mention',
            `${user.name} mentioned you in #${channelName}`,
            'message-square',
            `/app/chat?channel=${channelSlug}&message_id=${result.insertId}`,
            { channel_slug: channelSlug, sender_id: user.id }
          );
          notifiedUserIds.add(targetId);
        }
      }
    } catch (err) {
      console.error('[WS] Error saving/broadcasting chat message:', err.message);
      this.sendToClient(client, `chat:${channelSlug}`, 'error', { message: 'Failed to send message.' });
    }
  }

  /**
   * Broadcast typing status to other subscribers in the chat channel.
   */
  async handleChatTyping(client, user, channelSlug, payload) {
    const { isTyping } = payload;
    const channelName = `chat:${channelSlug}`;

    if (!this.channels.has(channelName)) return;

    try {
      const [channels] = await pool.query('SELECT write_roles FROM chat_channels WHERE slug = ? LIMIT 1', [channelSlug]);
      if (channels.length > 0) {
        const write = channels[0].write_roles;
        let writeRoles = typeof write === 'string' ? JSON.parse(write) : write;
        if (writeRoles && Array.isArray(writeRoles) && !writeRoles.includes(user.role)) {
          return; // Silently drop typing updates from unauthorized users
        }
      }
    } catch (err) {
      console.error('[WS] Error checking typing write_roles:', err.message);
      return;
    }

    const message = JSON.stringify({
      type: 'typing',
      channel: channelName,
      payload: {
        userId: user.id,
        firstName: user.username || user.first_name || user.name.split(' ')[0],
        name: user.name,
        avatar: user.avatar,
        isTyping: !!isTyping,
      },
    });

    const clients = this.channels.get(channelName);
    for (const otherClient of clients) {
      // Send to all subscribers EXCEPT the one who is typing
      if (otherClient !== client && otherClient.readyState === 1) {
        otherClient.send(message);
      }
    }
  }

  /**
   * Toggle emoji reaction, enforce limit of 5 reactions per user per message, and broadcast updated reactions.
   */
  async handleChatReaction(client, user, channelSlug, payload) {
    const { messageId, emoji } = payload;
    if (!messageId || !emoji) return;

    try {
      // 1. Check if reaction exists (using BINARY to prevent MySQL emoji equivalence collation collision)
      const [existing] = await pool.query(
        'SELECT id FROM chat_message_reactions WHERE message_id = ? AND user_id = ? AND BINARY emoji = ? LIMIT 1',
        [messageId, user.id, emoji]
      );

      if (existing.length > 0) {
        // User clicked the same emoji again, remove it
        await pool.query('DELETE FROM chat_message_reactions WHERE id = ?', [existing[0].id]);
      } else {
        // Delete all other reactions this user has on this message
        await pool.query(
          'DELETE FROM chat_message_reactions WHERE message_id = ? AND user_id = ?',
          [messageId, user.id]
        );

        // Insert new reaction
        await pool.query(
          'INSERT INTO chat_message_reactions (message_id, user_id, emoji, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [messageId, user.id, emoji]
        );
      }

      // 2. Fetch updated reaction list for this message (concatenating first, middle, last names)
      const [rawReactions] = await pool.query(
        `SELECT r.emoji, r.user_id, 
                u.username,
                TRIM(CONCAT(u.first_name, ' ', IFNULL(CONCAT(u.middle_name, ' '), ''), u.last_name)) as name 
         FROM chat_message_reactions r 
         LEFT JOIN users u ON r.user_id = u.id 
         WHERE r.message_id = ?`,
        [messageId]
      );

      // 3. Group and aggregate reactions
      const reactionsMap = {};
      rawReactions.forEach((row) => {
        if (!reactionsMap[row.emoji]) {
          reactionsMap[row.emoji] = {
            emoji: row.emoji,
            count: 0,
            users: [],
            userIds: []
          };
        }
        reactionsMap[row.emoji].count += 1;
        reactionsMap[row.emoji].users.push(row.username || row.name || 'Anonymous');
        reactionsMap[row.emoji].userIds.push(row.user_id);
      });

      // Format for broadcast
      // Each subscriber will receive this. We send the full map, and then we let them compute if they themselves reacted.
      // Alternatively, we broadcast the summary with userIds and let the clients map it locally, or send a general map.
      // Let's broadcast the raw summary with 'userIds' so the frontend can easily match if current user is in `userIds`!
      const reactionsSummary = Object.values(reactionsMap).map(item => ({
        emoji: item.emoji,
        count: item.count,
        users: item.users,
        userIds: item.userIds
      }));

      // 4. Broadcast updated reaction summary to all subscribers of the channel
      this.broadcast(`chat:${channelSlug}`, 'reaction_update', {
        messageId,
        reactions: reactionsSummary
      });

    } catch (err) {
      console.error('[WS] Error handling chat reaction:', err.message);
      this.sendToClient(client, `chat:${channelSlug}`, 'error', { message: 'Failed to process reaction.' });
    }
  }

  /**
   * Handle admin message deletion via WebSocket.
   * Verifies manage_chat permission, soft-deletes in DB, and broadcasts to channel.
   */
  async handleDeleteMessage(client, user, channelSlug, payload) {
    const { messageId, reason } = payload;
    if (!messageId || !reason || !reason.trim()) {
      this.sendToClient(client, `chat:${channelSlug}`, 'error', { message: 'Message ID and reason are required.' });
      return;
    }

    try {
      // Check manage_chat permission
      const hasPermission = user.role === 'superadmin' || 
        (Array.isArray(user.permission_keys) && user.permission_keys.includes('manage_chat'));

      if (!hasPermission) {
        console.log(`[WS] Delete rejected: User ${user.name} lacks manage_chat permission`);
        this.sendToClient(client, `chat:${channelSlug}`, 'error', { message: 'You do not have permission to delete messages.' });
        return;
      }

      // Verify message exists and is not already deleted
      const [msgs] = await pool.query(
        `SELECT m.id, m.content, m.user_id, m.is_deleted, c.slug, c.name 
         FROM chat_messages m
         LEFT JOIN chat_channels c ON m.channel_id = c.id
         WHERE m.id = ? LIMIT 1`,
        [messageId]
      );

      if (msgs.length === 0) {
        this.sendToClient(client, `chat:${channelSlug}`, 'error', { message: 'Message not found.' });
        return;
      }

      if (msgs[0].is_deleted) {
        this.sendToClient(client, `chat:${channelSlug}`, 'error', { message: 'This message has already been deleted.' });
        return;
      }

      // Soft-delete the message
      await pool.query(
        'UPDATE chat_messages SET is_deleted = 1, deleted_by = ?, deletion_reason = ?, deleted_at_timestamp = NOW() WHERE id = ?',
        [user.id, reason.trim(), messageId]
      );

      console.log(`[WS] Message ${messageId} deleted by ${user.name} (ID: ${user.id}) - Reason: ${reason}`);

      // Build the replacement content
      const replacementContent = `This message has been removed by an Admin because of "${reason.trim()}".`;

      // Broadcast the deletion to all channel subscribers
      this.broadcast(`chat:${channelSlug}`, 'message_deleted', {
        messageId,
        content: replacementContent,
        reason: reason.trim(),
      });

      const deletedMessageAuthorId = msgs[0].user_id;
      const channelName = msgs[0].name;

      if (deletedMessageAuthorId !== user.id) {
        await this.createNotification(
          deletedMessageAuthorId,
          'chat_message_deleted',
          'Message Deleted',
          `Your message in #${channelName} was removed by an Admin because of "${reason.trim()}"`,
          'trash-2',
          `/app/chat?channel=${channelSlug}&message_id=${messageId}`,
          { channel_slug: channelSlug, deletion_reason: reason.trim() }
        );
      }

    } catch (err) {
      console.error('[WS] Error handling message deletion:', err.message);
      this.sendToClient(client, `chat:${channelSlug}`, 'error', { message: 'Failed to delete message.' });
    }
  }
}

module.exports = ChannelManager;
