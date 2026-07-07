// ============================================
// CLI Customization Configuration
// Edit this file to add/modify files, commands,
// and terminal responses.
// ============================================

export interface CLIFile {
  name: string;
  category: "doc" | "data" | "config";
  content: string;
  description: string;
}

export interface CLICommand {
  name: string;
  description: string;
  action?: (args: string[]) => string | { output: string; callback?: () => void };
}

// 1. Simulated Virtual File System for the CLI
export const cliFileSystem: Record<string, CLIFile> = {
  "about.md": {
    name: "about.md",
    category: "doc",
    description: "About the Cyberlogic Club",
    content: `# CYBERLOGIC CLUB
----------------
The premier student cyber and tech organization.
Mission: Empower students with practical skills.
Vision: Forge the next generation of digital innovators and pioneers.

OFFICERS:
- Ian Jade Lugtanan (President 💻)
- Heart Murillo (Vice President 💖)
- Kent Ian Perez (Secretary 📝)
- Samson Bogs Amahan III (Treasurer 💸)
- Steven Ochigue (Auditor 🕵️)
- Michael Angelo Hortilano (Public Information Officer 📢)

Type 'cat contact.txt' for contact info.`,
  },
  "upcoming_events.txt": {
    name: "upcoming_events.txt",
    category: "data",
    description: "List of upcoming club activities",
    content: `# UPCOMING EVENTS 2026
---------------------
[1] Cyberlogic Logo Making Contest
    - Date: July 8, 2026 (2:00 PM - 5:00 PM)
    - Loc: IT Lab
    - Desc: First club logo making contest for the Cyberlogic Club logo!`,
  },
  "latest_announcements.txt": {
    name: "latest_announcements.txt",
    category: "data",
    description: "Recent announcements and notices",
    content: `# CLUB NOTICES
--------------
* Pinned: Cyberlogic Club Recruitment is NOW OPEN!
  Apply online at /register.`,
  },
  "resources.json": {
    name: "resources.json",
    category: "data",
    description: "Available guides and utilities",
    content: `{
  "featured_resources": [
    {
      "title": "Coming Soon!",
      "type": "N/A",
      "desc": "Stay tuned for updates!"
    },
  ]
}`,
  },
  "contact.txt": {
    name: "contact.txt",
    category: "doc",
    description: "Contact and support info",
    content: `CONTACT CHANNELS:
- Email: odemiluyan@srcb.edu.ph
- Office: HED Faculty Office
- Hotline: TBA
- Online Portal: /about (Contact section)`,
  },
  "theme_config.cfg": {
    name: "theme_config.cfg",
    category: "config",
    description: "Portal theme custom configuration",
    content: `# SYSTEM THEME CONFIGURATION
# To change portal theme, type: theme [name]
# Available profiles:
#   - cyber         (Default Dark Cyberpunk - Cyan & Purple)
#   - matrix        (Digital Rain - Green & Emerald)
#   - amber         (Retro Terminal - Amber & Orange)
#   - rose          (Neon Rose - Rose & Violet)
#   - royal         (Blue Blood - Indigo & Blue)
#   - light_classic (Classic Slate Light - Amber & Indigo)
#   - light_neo     (Neon Crisp Light - Cyan & Pink)
#   - light_mint    (Soothing Green Light - Mint & Sky)
#   - light_lavender (Lavender Mist Light - Purple & Pink)
#   - light_retro   (Warm Sand Light - Brown & Teal)
#   - maroon_spider (Maroon Spider - Maroon & Black)

current_theme=cyber`,
  },
};

// 2. Custom Terminal System Messages
export const terminalMessages = {
  welcomeHeader: `====================================================================================================================================
 _______   _______ ___________ _     _____ _____ _____ _____ 
/  __ \\ \\ / / ___ \\  ___| ___ \\ |   |  _  |  __ \\_   _/  __ \\
| /  \\/\\ V /| |_/ / |__ | |_/ / |   | | | | |  \\/ | | | /  \\/
| |     \\ / | ___ \\  __||    /| |   | | | | | __  | | | |    
| \\__/\\ | | | |_/ / |___| |\\ \\| |___\\ \\_/ / |_\\ \\_| |_| \\__/\\
 \\____/ \\_/ \\____/\\____/\\_| \\_\\_____/\\___/ \\____/\\___/ \\____/
                                                             
====================================================================================================================================
SYSTEM: v4.1.0-STABLE // ROOT PRIVILEGES GRANTED
Type 'help' to see list of available commands.
Type 'ls' to view directory files.
------------------------------------------------------------------------------------------------------------------------------------`,
  notFound: (cmd: string) => `cyberlogic: command not found: '${cmd}'. Type 'help' for support.`,
  catUsage: "Usage: cat [filename]  (e.g., cat about.md)",
  themeUsage: "Usage: theme [profile]  (e.g., theme matrix). Type 'cat theme_config.cfg' to list profiles.",
};
