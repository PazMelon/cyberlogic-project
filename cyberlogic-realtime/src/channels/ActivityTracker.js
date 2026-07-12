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
        "⏱️ 30 minutes of activity logged for @{username} as they are {context}",
        "⏱️ Half an hour online for @{username}! Spotted {context}.",
        "⏱️ @{username} has been hanging around for a solid 30 minutes, mostly {context}.",
        "⏱️ 30-minute check! @{username} is currently spotted {context}.",
        "⏱️ Look who has been active for half an hour! @{username} is {context}.",
        "⏱️ @{username} is clocking 30 minutes online while {context}.",
        "⏱️ 30 minutes in the digital realm for @{username}, currently {context}.",
        "⏱️ @{username} is keeping the session active! 30 minutes deep, {context}.",
        "⏱️ Time check: @{username} has been with us for 30 minutes, currently {context}.",
        "⏱️ @{username} just unlocked the 30-minute online badge while {context}.",
        "⏱️ Half-hour online milestone achieved! @{username} seems busy {context}.",
        "⏱️ @{username} is 30 minutes into their cyber journey, {context}.",
        "⏱️ 30 minutes of uptime recorded for @{username} as they are {context}.",
        "⏱️ @{username} has spent the last 30 minutes of their session {context}.",
        "⏱️ Half-hour milestone achieved! @{username} is currently {context}.",
        "⏱️ @{username} is 30 minutes active now, last seen {context}.",
        "⏱️ Uptime report: @{username} has been online for 30 minutes, {context}.",
        "⏱️ @{username} is 30 minutes deep into the network, spotted {context}.",
        "⏱️ 30 minutes of server presence logged for @{username} while {context}.",
        "⏱️ @{username} is 30 minutes online and counting, currently {context}.",
        "⏱️ Half-hour mark reached by @{username}! Rumor has it they are {context}.",
        "⏱️ @{username} has been roaming the platform for 30 minutes, currently {context}.",
        "⏱️ 30 minutes of pure dedication from @{username} while {context}.",
        "⏱️ @{username} is 30 minutes into their session, currently spotted {context}.",
        "⏱️ 30 minutes check-in: @{username} is busy {context}.",
        "⏱️ Half an hour of scrolling/lurking for @{username}, currently {context}.",
        "⏱️ @{username} is 30 minutes active, currently {context}.",
        "⏱️ 30 minutes logged for @{username} as they continue {context}.",
        "⏱️ @{username} is half an hour deep, currently {context}.",
        "⏱️ 30 minutes online for @{username}, seen {context}.",
        "⏱️ @{username} hit the 30-minute milestone while {context}.",
        "⏱️ 30 minutes of session time passed for @{username}, currently {context}."
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
        "🔥 @{username} is 1 hour deep into the Cyberlogic space, {context}",
        "🔥 Uptime alert: @{username} just passed 1 hour online, currently {context}.",
        "🔥 @{username} has been active for a full hour! Spotted {context}.",
        "🔥 60 minutes and counting! @{username} is currently {context}.",
        "🔥 @{username} reached the 1-hour milestone, currently {context}.",
        "🔥 One hour check-in: @{username} is still going, currently {context}.",
        "🔥 @{username} is 1 hour deep into their session while {context}.",
        "🔥 1 hour of active status recorded for @{username}! They are {context}.",
        "🔥 @{username} just hit 1 hour on the platform, seen {context}.",
        "🔥 One hour of digital presence for @{username}, currently {context}.",
        "🔥 @{username} is 1 hour into the flow state, currently {context}.",
        "🔥 1 hour milestone unlocked! @{username} is busy {context}.",
        "🔥 @{username} has been online for a whole hour, spotted {context}.",
        "🔥 One hour deep: @{username} is still {context}.",
        "🔥 @{username} has spent the last hour {context}.",
        "🔥 60 minutes online for @{username}! They are {context}.",
        "🔥 One hour check: @{username} is still active, currently {context}.",
        "🔥 @{username} is 1 hour active now, last seen {context}.",
        "🔥 Uptime check: @{username} has been online for 1 hour, {context}.",
        "🔥 @{username} is 1 hour deep into the session, spotted {context}.",
        "🔥 1 hour of server presence logged for @{username} while {context}.",
        "🔥 @{username} is 1 hour online and counting, currently {context}.",
        "🔥 One-hour mark reached by @{username}! Rumor has it they are {context}.",
        "🔥 @{username} has been roaming the platform for 1 hour, currently {context}.",
        "🔥 1 hour of pure dedication from @{username} while {context}.",
        "🔥 @{username} is 1 hour into their session, currently spotted {context}.",
        "🔥 1 hour check-in: @{username} is busy {context}.",
        "🔥 One hour of scrolling/lurking for @{username}, currently {context}.",
        "🔥 @{username} is 1 hour active, currently {context}.",
        "🔥 1 hour logged for @{username} as they continue {context}.",
        "🔥 @{username} is one hour deep, currently {context}.",
        "🔥 1 hour online for @{username}, seen {context}."
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
        "⚡ Two hours check: @{username} is still {context}",
        "⚡ Double-hour mark! @{username} has been online for 2 hours, currently {context}.",
        "⚡ @{username} has been active for 2 full hours! Spotted {context}.",
        "⚡ 120 minutes and counting! @{username} is currently {context}.",
        "⚡ @{username} reached the 2-hour milestone, currently {context}.",
        "⚡ Two hours check-in: @{username} is still going, currently {context}.",
        "⚡ @{username} is 2 hours deep into their session while {context}.",
        "⚡ 2 hours of active status recorded for @{username}! They are {context}.",
        "⚡ @{username} just hit 2 hours on the platform, seen {context}.",
        "⚡ Two hours of digital presence for @{username}, currently {context}.",
        "⚡ @{username} is 2 hours into the flow state, currently {context}.",
        "⚡ 2 hours milestone unlocked! @{username} is busy {context}.",
        "⚡ @{username} has been online for 2 whole hours, spotted {context}.",
        "⚡ Two hours deep: @{username} is still {context}.",
        "⚡ @{username} has spent the last 2 hours {context}.",
        "⚡ 120 minutes online for @{username}! They are {context}.",
        "⚡ Two hours check: @{username} is still active, currently {context}.",
        "⚡ @{username} is 2 hours active now, last seen {context}.",
        "⚡ Uptime check: @{username} has been online for 2 hours, {context}.",
        "⚡ @{username} is 2 hours deep into the session, spotted {context}.",
        "⚡ 2 hours of server presence logged for @{username} while {context}.",
        "⚡ @{username} is 2 hours online and counting, currently {context}.",
        "⚡ Two-hour mark reached by @{username}! Rumor has it they are {context}.",
        "⚡ @{username} has been roaming the platform for 2 hours, currently {context}.",
        "⚡ 2 hours of pure dedication from @{username} while {context}.",
        "⚡ @{username} is 2 hours into their session, currently spotted {context}.",
        "⚡ 2 hours check-in: @{username} is busy {context}.",
        "⚡ Two hours of scrolling/lurking for @{username}, currently {context}.",
        "⚡ @{username} is 2 hours active, currently {context}.",
        "⚡ 2 hours logged for @{username} as they continue {context}.",
        "⚡ @{username} is two hours deep, currently {context}.",
        "⚡ 2 hours online for @{username}, seen {context}."
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
        "🏆 Three hours check: @{username} is still {context}",
        "🏆 Triple-hour mark! @{username} has been online for 3 hours, currently {context}.",
        "🏆 @{username} has been active for 3 full hours! Spotted {context}.",
        "🏆 180 minutes and counting! @{username} is currently {context}.",
        "🏆 @{username} reached the 3-hour milestone, currently {context}.",
        "🏆 Three hours check-in: @{username} is still going, currently {context}.",
        "🏆 @{username} is 3 hours deep into their session while {context}.",
        "🏆 3 hours of active status recorded for @{username}! They are {context}.",
        "🏆 @{username} just hit 3 hours on the platform, seen {context}.",
        "🏆 Three hours of digital presence for @{username}, currently {context}.",
        "🏆 @{username} is 3 hours into the flow state, currently {context}.",
        "🏆 3 hours milestone unlocked! @{username} is busy {context}.",
        "🏆 @{username} has been online for 3 whole hours, spotted {context}.",
        "🏆 Three hours deep: @{username} is still {context}.",
        "🏆 @{username} has spent the last 3 hours {context}.",
        "🏆 180 minutes online for @{username}! They are {context}.",
        "🏆 Three hours check: @{username} is still active, currently {context}.",
        "🏆 @{username} is 3 hours active now, last seen {context}.",
        "🏆 Uptime check: @{username} has been online for 3 hours, {context}.",
        "🏆 @{username} is 3 hours deep into the session, spotted {context}.",
        "🏆 3 hours of server presence logged for @{username} while {context}.",
        "🏆 @{username} is 3 hours online and counting, currently {context}.",
        "🏆 Three-hour mark reached by @{username}! Rumor has it they are {context}.",
        "🏆 @{username} has been roaming the platform for 3 hours, currently {context}.",
        "🏆 3 hours of pure dedication from @{username} while {context}.",
        "🏆 @{username} is 3 hours into their session, currently spotted {context}.",
        "🏆 3 hours check-in: @{username} is busy {context}.",
        "🏆 Three hours of scrolling/lurking for @{username}, currently {context}.",
        "🏆 @{username} is 3 hours active, currently {context}.",
        "🏆 3 hours logged for @{username} as they continue {context}.",
        "🏆 @{username} is three hours deep, currently {context}.",
        "🏆 3 hours online for @{username}, seen {context}."
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
        "🌙 Four hours check: @{username} is still {context}",
        "🌙 Quad-hour mark! @{username} has been online for 4 hours, currently {context}.",
        "🌙 @{username} has been active for 4 full hours! Spotted {context}.",
        "🌙 240 minutes and counting! @{username} is currently {context}.",
        "🌙 @{username} reached the 4-hour milestone, currently {context}.",
        "🌙 Four hours check-in: @{username} is still going, currently {context}.",
        "🌙 @{username} is 4 hours deep into their session while {context}.",
        "🌙 4 hours of active status recorded for @{username}! They are {context}.",
        "🌙 @{username} just hit 4 hours on the platform, seen {context}.",
        "🌙 Four hours of digital presence for @{username}, currently {context}.",
        "🌙 @{username} is 4 hours into the zone, currently {context}.",
        "🌙 4 hours milestone unlocked! @{username} is busy {context}.",
        "🌙 @{username} has been online for 4 whole hours, spotted {context}.",
        "🌙 Four hours deep: @{username} is still {context}.",
        "🌙 @{username} has spent the last 4 hours {context}.",
        "🌙 240 minutes online for @{username}! They are {context}.",
        "🌙 Four hours check: @{username} is still active, currently {context}.",
        "🌙 @{username} is 4 hours active now, last seen {context}.",
        "🌙 Uptime check: @{username} has been online for 4 hours, {context}.",
        "🌙 @{username} is 4 hours deep into the session, spotted {context}.",
        "🌙 4 hours of server presence logged for @{username} while {context}.",
        "🌙 @{username} is 4 hours online and counting, currently {context}.",
        "🌙 Four-hour mark reached by @{username}! Rumor has it they are {context}.",
        "🌙 @{username} has been roaming the platform for 4 hours, currently {context}.",
        "🌙 4 hours of pure dedication from @{username} while {context}.",
        "🌙 @{username} is 4 hours into their session, currently spotted {context}.",
        "🌙 4 hours check-in: @{username} is busy {context}.",
        "🌙 Four hours of scrolling/lurking for @{username}, currently {context}.",
        "🌙 @{username} is 4 hours active, currently {context}.",
        "🌙 4 hours logged for @{username} as they continue {context}.",
        "🌙 @{username} is four hours deep, currently {context}.",
        "🌙 4 hours online for @{username}, seen {context}."
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
        "👑 Five hours check: @{username} is still {context}",
        "👑 Legendary 5-hour mark! @{username} has been online for 5 hours, currently {context}.",
        "👑 @{username} has been active for 5 full hours! Spotted {context}.",
        "👑 300 minutes and counting! @{username} is currently {context}.",
        "👑 @{username} reached the ultimate 5-hour milestone, currently {context}.",
        "👑 Five hours check-in: @{username} is still going, currently {context}.",
        "👑 @{username} is 5 hours deep into their session while {context}.",
        "👑 5 hours of active status recorded for @{username}! They are {context}.",
        "👑 @{username} just hit 5 hours on the platform, seen {context}.",
        "👑 Five hours of digital presence for @{username}, currently {context}.",
        "👑 @{username} is 5 hours into the zone, currently {context}.",
        "👑 5 hours milestone unlocked! @{username} is busy {context}.",
        "👑 @{username} has been online for 5 whole hours, spotted {context}.",
        "👑 Five hours deep: @{username} is still {context}.",
        "👑 @{username} has spent the last 5 hours {context}.",
        "👑 300 minutes online for @{username}! They are {context}.",
        "👑 Five hours check: @{username} is still active, currently {context}.",
        "👑 @{username} is 5 hours active now, last seen {context}.",
        "👑 Uptime check: @{username} has been online for 5 hours, {context}.",
        "👑 @{username} is 5 hours deep into the session, spotted {context}.",
        "👑 5 hours of server presence logged for @{username} while {context}.",
        "👑 @{username} is 5 hours online and counting, currently {context}.",
        "👑 Five-hour mark reached by @{username}! Rumor has it they are {context}.",
        "👑 @{username} has been roaming the platform for 5 hours, currently {context}.",
        "👑 5 hours of pure dedication from @{username} while {context}.",
        "👑 @{username} is 5 hours into their session, currently spotted {context}.",
        "👑 5 hours check-in: @{username} is busy {context}.",
        "👑 Five hours of scrolling/lurking for @{username}, currently {context}.",
        "👑 @{username} is 5 hours active, currently {context}.",
        "👑 5 hours logged for @{username} as they continue {context}.",
        "👑 @{username} is five hours deep, currently {context}.",
        "👑 5 hours online for @{username}, seen {context}."
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

    const existingSession = this.activeSessions.get(user.id);
    if (existingSession && existingSession.pendingDisconnect) {
      // Reconnected within the 30-minute grace period!
      // Cancel the pending disconnect and restore active state.
      existingSession.pendingDisconnect = false;
      delete existingSession.disconnectTime;
      console.log(`[Activity Log] User @${user.username || user.name} reconnected within grace period. Session restored.`);
      return;
    }

    this.activeSessions.set(user.id, {
      connectTime: Date.now(),
      lastMilestone: 0,
      user,
      pendingDisconnect: false
    });

    const username = user.username || user.name;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = `🟢 @${username} logged in at ${timeStr}`;
    
    await this.postBotMessage(message);
  }

  async onUserDisconnect(user) {
    const session = this.activeSessions.get(user.id);
    if (!session) return;

    // Put session on hold: wait for 30 minutes grace period
    session.pendingDisconnect = true;
    session.disconnectTime = Date.now();
    console.log(`[Activity Log] User @${user.username || user.name} disconnected. Grace period active (30 minutes).`);
  }

  async _checkMilestones() {
    const now = Date.now();
    const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

    for (const [userId, session] of this.activeSessions.entries()) {
      if (session.pendingDisconnect) {
        // Check if the 30 minutes grace period has expired
        if (now - session.disconnectTime >= GRACE_PERIOD_MS) {
          const durationMs = session.disconnectTime - session.connectTime;
          const durationMin = Math.round(durationMs / (60 * 1000));
          const username = session.user.username || session.user.name;

          const message = `🔴 @${username} went offline after ${durationMin} minutes of activity`;
          await this.postBotMessage(message);

          // Fully clean up the session now
          this.activeSessions.delete(userId);
        }
        continue;
      }

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
        timestamp: new Date().toISOString(),
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
