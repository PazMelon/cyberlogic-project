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
The premier student cybersecurity and tech organization.
Mission: Empower students with practical skills.
Vision: Forge the next generation of digital defenders.

OFFICERS:
- Alex Reyes (President)
- Samantha Cruz (Vice President)
- Miguel Torres (Secretary)
- Jessica Lim (Treasurer)
- Carlos Mendoza (Tech Lead)
- Anna Garcia (Events Coordinator)

Type 'cat contact.txt' for contact info.`,
  },
  "upcoming_events.txt": {
    name: "upcoming_events.txt",
    category: "data",
    description: "List of upcoming club activities",
    content: `# UPCOMING EVENTS 2026
---------------------
[1] Intro to Cybersecurity Workshop
    - Date: July 10, 2026 (2:00 PM - 5:00 PM)
    - Loc: IT Lab 3, Building C
    - Desc: Fundamentals of cybersecurity and threat modeling.

[2] Web Application Security Seminar
    - Date: July 15, 2026 (1:00 PM - 3:00 PM)
    - Loc: Auditorium A
    - Desc: Live demo of OWASP Top 10 vulnerabilities.

[3] Internal CTF Challenge
    - Date: July 18, 2026 (9:00 AM - 6:00 PM)
    - Loc: Computer Lab 1 & 2
    - Desc: Monthly Capture the Flag with prizes!`,
  },
  "latest_announcements.txt": {
    name: "latest_announcements.txt",
    category: "data",
    description: "Recent announcements and notices",
    content: `# CLUB NOTICES
--------------
* Pinned: Cyberlogic Club Recruitment is NOW OPEN!
  Apply online at /register before July 15.
  
* Results: Team Alpha placed 2nd at the National CTF!
  Congratulations to Samantha, Alex, and Carlos!
  
* Training: New Ethical Hacking Learning Path available.
  Check out /resources for details.`,
  },
  "resources.json": {
    name: "resources.json",
    category: "data",
    description: "Available guides and utilities",
    content: `{
  "featured_resources": [
    {
      "title": "Python Automation Toolkit",
      "type": "Tools",
      "desc": "Scripts for common security tasks."
    },
    {
      "title": "Network Security Fundamentals",
      "type": "Tutorials",
      "desc": "A student guide to TCP/IP & VPNs."
    },
    {
      "title": "Linux Command Cheat Sheet",
      "type": "Cheat Sheet",
      "desc": "Commands every member should know."
    }
  ]
}`,
  },
  "contact.txt": {
    name: "contact.txt",
    category: "doc",
    description: "Contact and support info",
    content: `CONTACT CHANNELS:
- Email: cyberlogic@university.edu
- Office: Room 301, Building A
- Hotline: +63 912 345 6789
- Online Portal: /about (Contact section)`,
  },
  "theme_config.cfg": {
    name: "theme_config.cfg",
    category: "config",
    description: "Portal theme custom configuration",
    content: `# SYSTEM THEME CONFIGURATION
# To change portal theme, type: theme [name]
# Available profiles:
#   - cyber     (Default Dark Cyberpunk - Cyan & Purple)
#   - matrix    (Digital Rain - Green & Emerald)
#   - amber     (Retro Terminal - Amber & Orange)
#   - rose      (Neon Rose - Rose & Violet)
#   - royal     (Blue Blood - Indigo & Blue)

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
