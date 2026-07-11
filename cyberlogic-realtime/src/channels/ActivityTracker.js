const pool = require('../db');

class ActivityTracker {
  constructor(channelManager) {
    this.channelManager = channelManager;
    // Maps userId -> { connectTime: number, lastMilestone: number, user: object }
    this.activeSessions = new Map();
    this.intervalId = null;

    // 20+ unique sayings per milestone tier
    this.sayings = {
      0.5: [
        "⏱️ @{username} has been online for 30 minutes — they must be {context}",
        "⏱️ @{username} is 30 minutes deep into their session — currently {context}",
        "⏱️ Half an hour flies when you're having fun! @{username} is {context}",
        "⏱️ @{username} has been active for 30 minutes — spotted {context}",
        "⏱️ 30 minutes of online status unlocked for @{username}! They are {context}",
        "⏱️ @{username} has been hanging out for 30 minutes, {context}",
        "⏱️ Half-hour milestone reached by @{username}! They are currently {context}",
        "⏱️ @{username} is vibing for 30 minutes now, {context}",
        "⏱️ 30 minutes in and @{username} is {context}",
        "⏱️ @{username} is keeping the server warm, 30 minutes and counting while {context}",
        "⏱️ Just checked in: @{username} has been active for 30 minutes, {context}",
        "⏱️ @{username} has been lurking for 30 minutes, {context}",
        "⏱️ 30 minutes of pure focus from @{username} while they are {context}",
        "⏱️ @{username} has spent the last 30 minutes {context}",
        "⏱️ Time check: @{username} has been connected for 30 minutes, {context}",
        "⏱️ 30 minutes of contribution/activity from @{username}! Currently {context}",
        "⏱️ @{username} has been online for 30 minutes — rumour says they are {context}",
        "⏱️ Half an hour online for @{username}! They are busy {context}",
        "⏱️ @{username} is 30 minutes into their cyber-journey today, {context}",
        "⏱️ 30 minutes of activity logged for @{username} as they are {context}"
      ],
      1: [
        "🔥 @{username} has been online for 1 hour! Legend has it they are {context}",
        "🔥 1 hour mark achieved by @{username}! Currently {context}",
        "🔥 One hour of dedication from @{username}! They must be {context}",
        "🔥 Time flies! @{username} has been active for 1 whole hour, {context}",
        "🔥 @{username} is 60 minutes deep into the zone, {context}",
        "🔥 1 hour online! @{username} is officially in the flow state, {context}",
        "🔥 One hour milestone unlocked for @{username}! They are {context}",
        "🔥 @{username} has been here for 1 hour now, {context}",
        "🔥 60 minutes of session time for @{username} as they are {context}",
        "🔥 @{username} has been active for 1 hour — probably {context}",
        "🔥 1 hour check: @{username} is still going strong, {context}",
        "🔥 One hour online for @{username}! Currently spotted {context}",
        "🔥 @{username} is 1 hour in — they must be really interested in {context}",
        "🔥 1 hour of server presence logged for @{username} while {context}",
        "🔥 @{username} has been connected for an hour, {context}",
        "🔥 60 minutes active: @{username} is {context}",
        "🔥 One hour milestone for @{username}! They are currently {context}",
        "🔥 @{username} hit the 1-hour mark! Spotted {context}",
        "🔥 1 hour session completed by @{username} while {context}",
        "🔥 @{username} is 1 hour deep into the Cyberlogic space, {context}"
      ],
      2: [
        "⚡ @{username} has been online for 2 hours! They must be {context}",
        "⚡ 2 hours active! @{username} is currently {context}",
        "⚡ Double hour milestone! @{username} is {context}",
        "⚡ @{username} has been here for 2 hours — legend says they are {context}",
        "⚡ 2 hours of session time logged for @{username}! Spotted {context}",
        "⚡ @{username} is 120 minutes deep into their session, {context}",
        "⚡ Two hours online for @{username}! Currently {context}",
        "⚡ @{username} is on a roll! 2 hours active while {context}",
        "⚡ 2 hours of dedication from @{username} as they are {context}",
        "⚡ Time flies when you're coding! @{username} has been here for 2 hours, {context}",
        "⚡ @{username} hit the 2-hour mark! They must be {context}",
        "⚡ Two hours milestone unlocked for @{username}! Currently {context}",
        "⚡ @{username} has been connected for 2 hours, {context}",
        "⚡ 2 hours in the matrix for @{username}! Spotted {context}",
        "⚡ @{username} is 2 hours deep in Cyberlogic, {context}",
        "⚡ Two hours of active log time for @{username}! They are {context}",
        "⚡ @{username} has spent the last 2 hours {context}",
        "⚡ 2 hours online! @{username} is currently {context}",
        "⚡ @{username} is a regular! 2 hours online, {context}",
        "⚡ Two hours check: @{username} is still {context}"
      ],
      3: [
        "🏆 @{username} has been online for 3 hours! They must be {context}",
        "🏆 3 hours and counting! @{username} is currently {context}",
        "🏆 Triple hour milestone! @{username} is {context}",
        "🏆 @{username} is 3 hours deep into their session, {context}",
        "🏆 Three hours online for @{username}! Spotted {context}",
        "🏆 @{username} is coding/browsing like a machine! 3 hours active while {context}",
        "🏆 3 hours of dedication from @{username} as they are {context}",
        "🏆 Three hours milestone unlocked for @{username}! Currently {context}",
        "🏆 @{username} has been here for 3 hours now, {context}",
        "🏆 3 hours check: @{username} is still going strong, {context}",
        "🏆 One, two, three hours for @{username}! Currently {context}",
        "🏆 @{username} is 3 hours in — they must be super focused on {context}",
        "🏆 3 hours of server presence logged for @{username} while {context}",
        "🏆 @{username} has been connected for three hours, {context}",
        "🏆 180 minutes active: @{username} is {context}",
        "🏆 Three hours of active log time for @{username}! They are {context}",
        "🏆 @{username} has spent the last 3 hours {context}",
        "🏆 3 hours online! @{username} is currently {context}",
        "🏆 @{username} is a true Cyberlogic enthusiast! 3 hours online, {context}",
        "🏆 Three hours check: @{username} is still {context}"
      ],
      4: [
        "🌙 @{username} has been online for 4 hours! They must be {context}",
        "🌙 4 hours active! @{username} is currently {context}",
        "🌙 Quad hour milestone! @{username} is {context}",
        "🌙 @{username} has been here for 4 hours — legend says they are {context}",
        "🌙 4 hours of session time logged for @{username}! Spotted {context}",
        "🌙 @{username} is 240 minutes deep into their session, {context}",
        "🌙 Four hours online for @{username}! Currently {context}",
        "🌙 @{username} is a powerhouse! 4 hours active while {context}",
        "🌙 4 hours of dedication from @{username} as they are {context}",
        "🌙 Time flies in the cyber zone! @{username} has been here for 4 hours, {context}",
        "🌙 @{username} hit the 4-hour mark! They must be {context}",
        "🌙 Four hours milestone unlocked for @{username}! Currently {context}",
        "🌙 @{username} has been connected for 4 hours, {context}",
        "🌙 4 hours in the zone for @{username}! Spotted {context}",
        "🌙 @{username} is 4 hours deep in the portal, {context}",
        "🌙 Four hours of active log time for @{username}! They are {context}",
        "🌙 @{username} has spent the last 4 hours {context}",
        "🌙 4 hours online! @{username} is currently {context}",
        "🌙 @{username} is a dedicated member! 4 hours online, {context}",
        "🌙 Four hours check: @{username} is still {context}"
      ],
      5: [
        "👑 @{username} has reached the legendary 5-hour mark! They must be {context}",
        "👑 5 hours active! @{username} is currently {context}",
        "👑 Penta hour milestone! @{username} is {context}",
        "👑 @{username} has been here for 5 hours — they basically live here now, {context}",
        "👑 5 hours of session time logged for @{username}! Spotted {context}",
        "👑 @{username} is 300 minutes deep into their session, {context}",
        "👑 Five hours online for @{username}! Currently {context}",
        "👑 @{username} is unstoppable! 5 hours active while {context}",
        "👑 5 hours of ultimate dedication from @{username} as they are {context}",
        "👑 Five hours check: @{username} is still {context}",
        "👑 @{username} hit the 5-hour mark! They must be {context}",
        "👑 Five hours milestone unlocked for @{username}! Currently {context}",
        "👑 @{username} has been connected for 5 hours, {context}",
        "👑 5 hours in the matrix for @{username}! Spotted {context}",
        "👑 @{username} is 5 hours deep in Cyberlogic, {context}",
        "👑 Five hours of active log time for @{username}! They are {context}",
        "👑 @{username} has spent the last 5 hours {context}",
        "👑 5 hours online! @{username} is currently {context}",
        "👑 @{username} is a certified Cyberlogic veteran! 5 hours online, {context}",
        "👑 Five hours check: @{username} is still {context}"
      ]
    };
  }

  start() {
    if (this.intervalId) return;
    // Check milestones every 30 seconds
    this.intervalId = setInterval(() => this._checkMilestones(), 30000);
    console.log('[Activity Log] Activity tracker interval started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Activity Log] Activity tracker interval stopped');
    }
  }

  async onUserConnect(user) {
    if (user.role === 'system' || user.id === 1) return;

    this.activeSessions.set(user.id, {
      connectTime: Date.now(),
      lastMilestone: 0,
      user
    });

    const username = user.username || user.name;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = `🟢 @${username} logged in at ${timeStr}`;
    
    await this.postBotMessage(message);
  }

  async onUserDisconnect(user) {
    const session = this.activeSessions.get(user.id);
    this.activeSessions.delete(user.id);

    if (!session) return;

    const durationMs = Date.now() - session.connectTime;
    const durationMin = Math.round(durationMs / (60 * 1000));
    const username = user.username || user.name;

    const message = `🔴 @${username} went offline after ${durationMin} minutes of activity`;
    await this.postBotMessage(message);
  }

  async _checkMilestones() {
    const now = Date.now();
    for (const [userId, session] of this.activeSessions.entries()) {
      const elapsedMs = now - session.connectTime;
      const elapsedMin = elapsedMs / (60 * 1000);
      
      let targetMilestone = 0;
      
      if (elapsedMin >= 300) {
        targetMilestone = 5;
      } else if (elapsedMin >= 240) {
        targetMilestone = 4;
      } else if (elapsedMin >= 180) {
        targetMilestone = 3;
      } else if (elapsedMin >= 120) {
        targetMilestone = 2;
      } else if (elapsedMin >= 60) {
        targetMilestone = 1;
      } else if (elapsedMin >= 30) {
        targetMilestone = 0.5;
      }

      if (targetMilestone > session.lastMilestone) {
        session.lastMilestone = targetMilestone;
        await this._triggerMilestoneMessage(session.user, targetMilestone);
      }
    }
  }

  async _triggerMilestoneMessage(user, milestone) {
    const context = await this.getUserContext(user.id);
    const username = user.username || user.name;
    const list = this.sayings[milestone];
    if (!list) return;

    const randTemplate = list[Math.floor(Math.random() * list.length)];
    const message = randTemplate
      .replace(/{username}/g, username)
      .replace(/{context}/g, context);

    await this.postBotMessage(message);
  }

  async getUserContext(userId) {
    const presence = this.channelManager.onlineUsers.get(Number(userId));
    if (!presence || !presence.clients) return 'exploring the club portal';
    
    let activeChannelSlug = null;
    let activeThreadId = null;

    for (const client of presence.clients) {
      const subs = this.channelManager.clientSubscriptions.get(client);
      if (subs) {
        for (const sub of subs) {
          if (sub.startsWith('chat:')) {
            activeChannelSlug = sub.split(':')[1];
          } else if (sub.startsWith('forums:thread:')) {
            activeThreadId = sub.split(':')[2];
          }
        }
      }
    }

    if (activeThreadId) {
      try {
        const [threads] = await pool.query('SELECT title FROM forum_threads WHERE id = ? LIMIT 1', [activeThreadId]);
        if (threads.length > 0) {
          return `deep diving into "${threads[0].title}" in the forums`;
        }
      } catch (e) {
        console.error('[Activity Log] Error fetching thread title:', e.message);
      }
      return 'reading a forum thread';
    }

    if (activeChannelSlug) {
      if (activeChannelSlug === 'activity-log') {
        return 'monitoring the #activity-log';
      }
      return `vibing in #${activeChannelSlug}`;
    }

    const defaults = [
      'exploring the club portal',
      'browsing the platform',
      'hanging around the portal',
      'checking out the latest resources',
      'navigating the dashboard'
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  async postBotMessage(content) {
    try {
      const [channels] = await pool.query("SELECT id FROM chat_channels WHERE slug = 'activity-log' LIMIT 1");
      if (channels.length === 0) return;
      const channelId = channels[0].id;

      // 1. Insert system message into database
      const [result] = await pool.query(
        "INSERT INTO chat_messages (channel_id, user_id, content, type, created_at, updated_at) VALUES (?, NULL, ?, 'system', NOW(), NOW())",
        [channelId, content]
      );

      // 2. Format message for realtime broadcast
      const formattedMsg = {
        id: result.insertId,
        channelId: 'activity-log',
        author: 'System Log',
        authorAvatar: '',
        authorId: 0,
        authorUsername: null,
        content: content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
        replyTo: null,
      };

      // 3. Broadcast to all clients subscribed to chat:activity-log
      this.channelManager.broadcast('chat:activity-log', 'message', formattedMsg);
    } catch (err) {
      console.error('[Activity Log] Error posting bot message:', err.message);
    }
  }
}

module.exports = ActivityTracker;
