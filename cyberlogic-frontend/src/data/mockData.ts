// ============================================
// Mock Data for Cyberlogic Club Portal
// All data is hardcoded for frontend mockup
// ============================================

import type {
  SectionType,
  ImageTemplate,
  ImageSlot,
  TextSection,
  ImageSection,
  QuoteSection,
  DividerSection,
  ContentSection
} from "../components/ui/cms/types";

export type {
  SectionType,
  ImageTemplate,
  ImageSlot,
  TextSection,
  ImageSection,
  QuoteSection,
  DividerSection,
  ContentSection
};

export interface Announcement {
  id: number;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  category: "General" | "Academic" | "Events";
  author: string;
  authorAvatar: string;
  date: string;
  pinned: boolean;
  sections?: ContentSection[];
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "Workshop" | "Seminar" | "Competition" | "Social" | "Meeting";
  image?: string;
  attendees: number;
  isRegistered?: boolean;
  capacity?: number;
  sections?: ContentSection[];
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  category: "Tutorials" | "Documents" | "Tools" | "Links";
  icon: string;
  link: string;
  downloadCount: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: "member" | "officer" | "admin" | "superadmin";
  joinedDate: string;
}

// ============================================
// ANNOUNCEMENTS
// ============================================
export const announcements: Announcement[] = [
  {
    id: 1,
    title: "Cyberlogic Club Recruitment — Now Open!",
    subtitle: "Join the premier student cyber security force and secure your digital future.",
    excerpt:
      "We're looking for passionate students who want to explore cybersecurity, programming, and tech innovation. Apply before July 15!",
    content: "Our organization is gearing up for a brand new semester. Whether you are an experienced script kiddie or just getting started with network commands, we have a place for you.",
    category: "General",
    author: "Admin",
    authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin",
    date: "2026-07-01",
    pinned: true,
    sections: [
      {
        type: "text",
        id: "section-1-1",
        title: "Who We Are",
        html: "<p>Cyberlogic Club is more than just a tech organization. We are a cohort of security researchers, software developers, and system administrators dedicated to mastering the digital domain. We run weekly sessions on ethical hacking, defensive security, reverse engineering, and cloud configurations.</p>"
      },
      {
        type: "image",
        id: "section-1-2",
        template: "bento-3",
        images: [
          { url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60", alt: "Cyber Lab" },
          { url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60", alt: "Servers" },
          { url: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=600&auto=format&fit=crop&q=60", alt: "Coding Workstation" }
        ],
        caption: "A look into our club's interactive setups"
      },
      {
        type: "text",
        id: "section-1-3",
        title: "Membership Benefits",
        html: "<p>As a member of Cyberlogic, you will gain access to exclusive study guides, vouchers for industry certifications, premium networking events with cyber security leaders, and team representation in national hacking competitions.</p>"
      }
    ]
  },
  {
    id: 2,
    title: "CTF Competition Results — Congratulations Team Alpha!",
    subtitle: "How Cyberlogic's elite hackers secured 2nd place in the National capture-the-flag final.",
    excerpt:
      "Our very own Team Alpha secured 2nd place at the National CTF Challenge. Read about their journey and strategies.",
    content: "The final scoreboard was locked in after 24 hours of non-stop vulnerability hunting. Team Alpha showcased incredible resilience in cryptography, web exploitation, and buffer overflow challenges.",
    category: "Events",
    author: "Coach Rivera",
    authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=rivera",
    date: "2026-06-28",
    pinned: false,
    sections: [
      {
        type: "text",
        id: "section-2-1",
        title: "A Hard-Fought Digital Battle",
        html: "<p>The competition gathered over 100 universities nationwide. From the first hour, Team Alpha took an aggressive stance, scoring first blood on a challenging reverse engineering binary payload. We are incredibly proud of their teamwork and technical agility.</p>"
      },
      {
        type: "image",
        id: "section-2-2",
        template: "side-by-side",
        images: [
          { url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=60", alt: "Cyber Command" },
          { url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&auto=format&fit=crop&q=60", alt: "Workstation" }
        ],
        caption: "Snapshots from the competition operations desk"
      },
      {
        type: "quote",
        id: "section-2-3",
        text: "The team focused heavily on scripting automation to brute-force crypto tokens, freeing up critical analyst time for web vulnerabilities. You can check the code walk-throughs in the upcoming academic assembly.",
        attribution: "Coach Rivera"
      }
    ]
  },
  {
    id: 3,
    title: "New Learning Path: Introduction to Ethical Hacking",
    subtitle: "A structured, self-paced syllabus to transition from terminal beginner to penetration tester.",
    excerpt:
      "A curated 6-week learning path covering network scanning, vulnerability assessment, and penetration testing basics.",
    content: "We are releasing a comprehensive learning deck compiled by club leaders and academic advisors to help members prepare for security roles.",
    category: "Academic",
    author: "Prof. Santos",
    authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=santos",
    date: "2026-06-25",
    pinned: false,
    sections: [
      {
        type: "text",
        id: "section-3-1",
        title: "Curriculum Syllabus Overview",
        html: "<p>The learning path is structured into 6 modules: 1) Linux & Networking Basics, 2) Reconnaissance & OSINT, 3) Vulnerability Scanning, 4) Web Exploitation, 5) Privilege Escalation, and 6) Reporting. Each module includes practice labs.</p>"
      },
      {
        type: "image",
        id: "section-3-2",
        template: "banner",
        images: [
          { url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80", alt: "Banner Road" }
        ],
        caption: "Ethical hacking training roadmap"
      }
    ]
  },
  {
    id: 4,
    title: "Server Maintenance Scheduled — July 5",
    subtitle: "Essential core cluster migrations to optimize portal response and latency.",
    excerpt:
      "The club portal will be undergoing maintenance from 10 PM to 2 AM. Please save your work beforehand.",
    content: "We will be transitioning our core backend virtual machines to an upgraded hypervisor nodes array to scale for the recruitment intake.",
    category: "General",
    author: "Admin",
    authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin",
    date: "2026-06-22",
    pinned: false,
    sections: [
      {
        type: "text",
        id: "section-4-1",
        title: "What to Expect",
        html: "<p>During the 4-hour window, the member portal, active chat servers, and CTF practice labs will experience brief downtime intervals. Static resources will remain accessible.</p>"
      },
      {
        type: "image",
        id: "section-4-2",
        template: "single",
        images: [
          { url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60", alt: "Database cluster" }
        ],
        caption: "Hypervisor hardware migration checks"
      }
    ]
  },
  {
    id: 5,
    title: "Workshop Materials Now Available",
    subtitle: "Access files and cheat sheets from the Python Automation assembly.",
    excerpt:
      "Slides, code samples, and recordings from the Python Automation Workshop are now uploaded to the Resources section.",
    content: "If you missed our live coding workshop last week, all recordings and repository links are now live for student retrieval.",
    category: "Academic",
    author: "Maria Cruz",
    authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=maria",
    date: "2026-06-20",
    pinned: false,
    sections: [
      {
        type: "text",
        id: "section-5-1",
        title: "Topics Covered",
        html: "<p>The files contain scripts demonstrating simple socket scanners, request-based web parsers, and auto-bruteforcers using standard libraries.</p>"
      }
    ]
  },
  {
    id: 6,
    title: "End-of-Semester Social — Save the Date!",
    subtitle: "Unwind, game, and celebrate our accomplishments with free pizza.",
    excerpt:
      "Join us for our end-of-semester celebration on July 20. Games, food, and awards await!",
    content: "We are wrapping up a highly successful semester with an in-person social event. Drop by to play board games, participate in split-screen gaming, and meet your teammates.",
    category: "Events",
    author: "Events Committee",
    authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=events",
    date: "2026-06-18",
    pinned: false,
    sections: [
      {
        type: "text",
        id: "section-6-1",
        title: "Pizza, Games, and Awards",
        html: "<p>We will be presenting awards to the top CTF contributors of the semester, followed by gaming tournaments. RSVP via the portal before July 18.</p>"
      },
      {
        type: "divider",
        id: "section-6-2"
      },
      {
        type: "quote",
        id: "section-6-3",
        text: "Join us to celebrate a semester of cybersecurity victories!",
        attribution: "Events Coordinator Committee"
      }
    ]
  }
];

// ============================================
// EVENTS
// ============================================
export const events: Event[] = [
  {
    id: 1,
    title: "Intro to Cybersecurity Workshop",
    description:
      "Learn the fundamentals of cybersecurity, including threat modeling, common attack vectors, and basic defense strategies.",
    date: "2026-07-10",
    startTime: "14:00",
    endTime: "17:00",
    location: "IT Lab 3, Building C",
    type: "Workshop",
    attendees: 42,
  },
  {
    id: 2,
    title: "Web Application Security Seminar",
    description:
      "A deep dive into OWASP Top 10 vulnerabilities with live demonstrations and mitigation techniques.",
    date: "2026-07-15",
    startTime: "13:00",
    endTime: "15:00",
    location: "Auditorium A",
    type: "Seminar",
    attendees: 78,
  },
  {
    id: 3,
    title: "Internal CTF Challenge",
    description:
      "Test your skills in our monthly Capture The Flag competition. Prizes for top 3 teams!",
    date: "2026-07-18",
    startTime: "09:00",
    endTime: "18:00",
    location: "Computer Lab 1 & 2",
    type: "Competition",
    attendees: 56,
  },
  {
    id: 4,
    title: "End-of-Semester Social",
    description:
      "Celebrate the semester with fellow members! Food, games, awards ceremony, and networking.",
    date: "2026-07-20",
    startTime: "17:00",
    endTime: "21:00",
    location: "Student Center Hall",
    type: "Social",
    attendees: 95,
  },
  {
    id: 5,
    title: "Club General Assembly",
    description:
      "Monthly general assembly to discuss club activities, upcoming plans, and open forum for suggestions.",
    date: "2026-07-25",
    startTime: "15:00",
    endTime: "16:30",
    location: "Room 301, Building A",
    type: "Meeting",
    attendees: 35,
  },
];

// ============================================
// RESOURCES
// ============================================
export const resources: Resource[] = [
  {
    id: 1,
    title: "Python Automation Toolkit",
    description:
      "Scripts and tools for automating common security tasks with Python.",
    category: "Tools",
    icon: "code",
    link: "#",
    downloadCount: 234,
  },
  {
    id: 2,
    title: "Network Security Fundamentals",
    description: "Comprehensive guide covering TCP/IP, firewalls, VPNs, and IDS/IPS systems.",
    category: "Tutorials",
    icon: "shield",
    link: "#",
    downloadCount: 456,
  },
  {
    id: 3,
    title: "Club Constitution & Bylaws",
    description: "Official Cyberlogic Club constitution, membership policies, and governance rules.",
    category: "Documents",
    icon: "file-text",
    link: "#",
    downloadCount: 128,
  },
  {
    id: 4,
    title: "CTF Practice Platforms",
    description: "Curated list of online CTF platforms for practicing hacking challenges.",
    category: "Links",
    icon: "external-link",
    link: "#",
    downloadCount: 567,
  },
  {
    id: 5,
    title: "Linux Command Cheat Sheet",
    description: "Essential Linux commands every cybersecurity student should know.",
    category: "Tutorials",
    icon: "terminal",
    link: "#",
    downloadCount: 789,
  },
  {
    id: 6,
    title: "Wireshark Packet Analysis Guide",
    description: "Step-by-step tutorial for network traffic analysis using Wireshark.",
    category: "Tutorials",
    icon: "activity",
    link: "#",
    downloadCount: 345,
  },
];

// ============================================
// TEAM MEMBERS
// ============================================
export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Alex Reyes",
    role: "President",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
    bio: "4th year CS student passionate about network security and ethical hacking.",
  },
  {
    id: 2,
    name: "Samantha Cruz",
    role: "Vice President",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=samantha",
    bio: "Specializes in web application security and leads our CTF team.",
  },
  {
    id: 3,
    name: "Miguel Torres",
    role: "Secretary",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=miguel",
    bio: "Keeps everything organized and manages club communications.",
  },
  {
    id: 4,
    name: "Jessica Lim",
    role: "Treasurer",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=jessica",
    bio: "Handles club finances and sponsors for events.",
  },
  {
    id: 5,
    name: "Carlos Mendoza",
    role: "Tech Lead",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos",
    bio: "Full-stack developer who maintains the club's infrastructure.",
  },
  {
    id: 6,
    name: "Anna Garcia",
    role: "Events Coordinator",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=anna",
    bio: "Organizes workshops, seminars, and social gatherings.",
  },
];

// ============================================
// STATS
// ============================================
export const clubStats = {
  members: 150,
  events: 24,
  projects: 12,
  awards: 8,
};

// ============================================
// MOCK USER
// ============================================
export const mockUser: User = {
  id: 1,
  name: "John Doe",
  email: "john.doe@university.edu",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=john",
  role: "member",
  joinedDate: "2025-09-01",
};

export const mockAdminUser: User = {
  id: 99,
  name: "Alex Reyes",
  email: "alex.reyes@uni.edu",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
  role: "admin",
  joinedDate: "2023-06-01",
};

// ============================================
// FORUM DATA
// ============================================
export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  threadCount: number;
  color: string;
}

export interface ForumThread {
  id: number;
  title: string;
  categoryId: string;
  author: string;
  authorAvatar: string;
  content: string;
  replyCount: number;
  likes: number;
  views: number;
  lastActivity: string;
  createdAt: string;
  pinned: boolean;
  solved: boolean;
}

export interface ForumReply {
  id: number;
  threadId: number;
  author: string;
  authorAvatar: string;
  authorRole: string;
  content: string;
  likes: number;
  createdAt: string;
  isBestAnswer: boolean;
}

export const forumCategories: ForumCategory[] = [
  { id: "general", name: "General Discussion", description: "Chat about anything club-related", threadCount: 34, color: "primary" },
  { id: "tech-talk", name: "Tech Talk", description: "Discuss latest tech, tools, and trends", threadCount: 28, color: "accent" },
  { id: "help", name: "Help & Support", description: "Ask questions and get help from members", threadCount: 19, color: "success" },
  { id: "ctf", name: "CTF Challenges", description: "Discuss CTF strategies and writeups", threadCount: 15, color: "error" },
  { id: "off-topic", name: "Off-Topic", description: "Random chats and fun stuff", threadCount: 22, color: "warning" },
];

export const forumThreads: ForumThread[] = [
  {
    id: 1, title: "Best resources for learning reverse engineering?", categoryId: "tech-talk",
    author: "Alex Reyes", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
    content: "Hey everyone! I'm looking to get into reverse engineering. What books, courses, or tools would you recommend for a beginner? I already have some experience with C and assembly.",
    replyCount: 12, likes: 24, views: 156, lastActivity: "2 hours ago", createdAt: "2026-07-01", pinned: true, solved: false,
  },
  {
    id: 2, title: "CTF Writeup: National Challenge Round 2", categoryId: "ctf",
    author: "Samantha Cruz", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=samantha",
    content: "Here's my writeup for the web exploitation challenges in Round 2 of the National CTF. The key insight was noticing the SSTI vulnerability in the template engine...",
    replyCount: 8, likes: 31, views: 203, lastActivity: "5 hours ago", createdAt: "2026-06-30", pinned: true, solved: false,
  },
  {
    id: 3, title: "Help: Can't get Burp Suite proxy working", categoryId: "help",
    author: "Maria Cruz", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=maria",
    content: "I installed Burp Suite Community Edition but I can't get the proxy to intercept HTTPS traffic. I've imported the CA certificate into Firefox but it's still not working. Any ideas?",
    replyCount: 6, likes: 4, views: 89, lastActivity: "1 day ago", createdAt: "2026-06-29", pinned: false, solved: true,
  },
  {
    id: 4, title: "What's your favorite Linux distro for pentesting?", categoryId: "general",
    author: "Carlos Mendoza", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos",
    content: "Curious about what distros everyone uses. I've been using Kali but thinking about switching to Parrot OS. Thoughts?",
    replyCount: 15, likes: 18, views: 245, lastActivity: "3 hours ago", createdAt: "2026-06-28", pinned: false, solved: false,
  },
  {
    id: 5, title: "Anyone going to DEF CON this year?", categoryId: "off-topic",
    author: "Jessica Lim", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=jessica",
    content: "Planning to attend DEF CON 34 this August. Would be cool to meet up with other Cyberlogic members! Who's in?",
    replyCount: 9, likes: 22, views: 134, lastActivity: "6 hours ago", createdAt: "2026-06-27", pinned: false, solved: false,
  },
  {
    id: 6, title: "Python script for automated Nmap scanning", categoryId: "tech-talk",
    author: "Miguel Torres", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=miguel",
    content: "I wrote a Python wrapper around Nmap that automates common scanning patterns and generates clean reports. Happy to share the repo if anyone's interested.",
    replyCount: 7, likes: 29, views: 178, lastActivity: "12 hours ago", createdAt: "2026-06-26", pinned: false, solved: false,
  },
  {
    id: 7, title: "Study group for CompTIA Security+?", categoryId: "general",
    author: "Anna Garcia", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=anna",
    content: "Anyone interested in forming a study group for the CompTIA Security+ certification? I'm planning to take the exam in September.",
    replyCount: 11, likes: 15, views: 112, lastActivity: "1 day ago", createdAt: "2026-06-25", pinned: false, solved: false,
  },
  {
    id: 8, title: "Interesting phishing attempt analysis", categoryId: "tech-talk",
    author: "Alex Reyes", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
    content: "Received a sophisticated phishing email today and decided to analyze it. The landing page was a nearly perfect clone of our university portal. Here's my breakdown of the techniques used...",
    replyCount: 5, likes: 33, views: 267, lastActivity: "2 days ago", createdAt: "2026-06-24", pinned: false, solved: false,
  },
];

export const forumReplies: ForumReply[] = [
  {
    id: 1, threadId: 1, author: "Samantha Cruz", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=samantha",
    authorRole: "Vice President", content: "I'd highly recommend starting with 'Practical Reverse Engineering' by Bruce Dang. Also, check out crackmes.one for practice challenges. Ghidra is a great free tool to start with!",
    likes: 12, createdAt: "2026-07-01 14:30", isBestAnswer: false,
  },
  {
    id: 2, threadId: 1, author: "Carlos Mendoza", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos",
    authorRole: "Tech Lead", content: "Adding to what Sam said — the 'RE for Beginners' book by Dennis Yurichev is free and excellent. For tools, I use both Ghidra and IDA Free depending on the task.",
    likes: 8, createdAt: "2026-07-01 15:45", isBestAnswer: false,
  },
  {
    id: 3, threadId: 1, author: "Miguel Torres", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=miguel",
    authorRole: "Secretary", content: "I learned a lot from the Malware Unicorn workshops. They have free online RE101 and RE102 courses that are really well structured.",
    likes: 15, createdAt: "2026-07-01 17:20", isBestAnswer: true,
  },
  {
    id: 4, threadId: 1, author: "Anna Garcia", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=anna",
    authorRole: "Events Coordinator", content: "We're actually planning a reverse engineering workshop next month! Stay tuned for the announcement. Would love to see you there Alex!",
    likes: 6, createdAt: "2026-07-02 09:10", isBestAnswer: false,
  },
];

// ============================================
// CHAT DATA
// ============================================
export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
}

export interface ChatMessage {
  id: number;
  channelId: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

export const chatChannels: ChatChannel[] = [
  { id: "general", name: "general", description: "General club chat", unreadCount: 3, lastMessage: "Anyone up for a study session tonight?", lastMessageTime: "2m ago" },
  { id: "tech-help", name: "tech-help", description: "Technical questions and help", unreadCount: 0, lastMessage: "Try running it with sudo", lastMessageTime: "15m ago" },
  { id: "random", name: "random", description: "Off-topic fun and memes", unreadCount: 7, lastMessage: "lol that's hilarious 😂", lastMessageTime: "1m ago" },
  { id: "announcements", name: "announcements", description: "Official club announcements", unreadCount: 1, lastMessage: "Recruitment is now open!", lastMessageTime: "1h ago" },
  { id: "ctf-team", name: "ctf-team", description: "CTF competition coordination", unreadCount: 0, lastMessage: "Good game everyone!", lastMessageTime: "3h ago" },
];

export const chatMessages: ChatMessage[] = [
  { id: 1, channelId: "general", author: "System", authorAvatar: "", content: "Welcome to #general! This is the main chat channel for Cyberlogic Club.", timestamp: "Jul 1, 9:00 AM", isSystem: true },
  { id: 2, channelId: "general", author: "Alex Reyes", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex", content: "Hey everyone! Hope you all had a great weekend. Don't forget about the workshop on Thursday!", timestamp: "Jul 3, 10:15 AM" },
  { id: 3, channelId: "general", author: "Samantha Cruz", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=samantha", content: "Thanks for the reminder Alex! I'll be presenting the OWASP Top 10 section.", timestamp: "Jul 3, 10:22 AM" },
  { id: 4, channelId: "general", author: "Carlos Mendoza", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos", content: "Just finished setting up the lab environment for the workshop. Everything's looking good 👍", timestamp: "Jul 3, 11:45 AM" },
  { id: 5, channelId: "general", author: "Jessica Lim", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=jessica", content: "Quick question — do we need to bring our own laptops for the workshop?", timestamp: "Jul 3, 12:30 PM" },
  { id: 6, channelId: "general", author: "Alex Reyes", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex", content: "Yes, please bring your laptops! We'll have VMs you can download beforehand. I'll share the link later today.", timestamp: "Jul 3, 12:35 PM" },
  { id: 7, channelId: "general", author: "Miguel Torres", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=miguel", content: "I'll prepare some snacks for the event. Any dietary restrictions I should know about?", timestamp: "Jul 3, 1:00 PM" },
  { id: 8, channelId: "general", author: "Anna Garcia", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=anna", content: "That's so thoughtful Miguel! I think we're good. Maybe some coffee too? ☕", timestamp: "Jul 3, 1:15 PM" },
  { id: 9, channelId: "general", author: "Maria Cruz", authorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=maria_chat", content: "Anyone up for a study session tonight? I'm reviewing for the Security+ exam.", timestamp: "Jul 4, 11:40 AM" },
];

// ============================================
// DIRECTORY DATA
// ============================================
export interface DirectoryMember {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: "President" | "Vice President" | "Secretary" | "Treasurer" | "Tech Lead" | "Events Coordinator" | "Member" | "Alumni" | "Admin" | "Super Admin" | "Moderator";
  department: string;
  yearLevel: string;
  expertise: string[];
  badges: string[];
  joinedDate: string;
  status: "online" | "offline" | "away";
  bio: string;
}

export const directoryMembers: DirectoryMember[] = [
  {
    id: 1, name: "Alex Reyes", email: "alex.reyes@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
    role: "President", department: "Computer Science", yearLevel: "4th Year",
    expertise: ["Network Security", "Ethical Hacking", "Leadership"],
    badges: ["Founder", "CTF Champion", "Mentor"],
    joinedDate: "2023-06-01", status: "online",
    bio: "Passionate about building secure systems and mentoring the next generation of cyber defenders.",
  },
  {
    id: 2, name: "Samantha Cruz", email: "sam.cruz@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=samantha",
    role: "Vice President", department: "Information Technology", yearLevel: "4th Year",
    expertise: ["Web Security", "OWASP", "Bug Bounty"],
    badges: ["CTF Champion", "Speaker", "Top Contributor"],
    joinedDate: "2023-06-01", status: "online",
    bio: "Web security specialist who loves breaking (and fixing) web applications.",
  },
  {
    id: 3, name: "Miguel Torres", email: "miguel.torres@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=miguel",
    role: "Secretary", department: "Computer Science", yearLevel: "3rd Year",
    expertise: ["Documentation", "Python", "Automation"],
    badges: ["Organizer", "Helper"],
    joinedDate: "2024-01-15", status: "away",
    bio: "Keeps the club organized and automates everything he can with Python.",
  },
  {
    id: 4, name: "Jessica Lim", email: "jessica.lim@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=jessica",
    role: "Treasurer", department: "Accountancy", yearLevel: "3rd Year",
    expertise: ["Finance", "Project Management", "Risk Analysis"],
    badges: ["Organizer"],
    joinedDate: "2024-01-15", status: "offline",
    bio: "Manages club finances and ensures we get the best value for our events.",
  },
  {
    id: 5, name: "Carlos Mendoza", email: "carlos.mendoza@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos",
    role: "Tech Lead", department: "Computer Science", yearLevel: "4th Year",
    expertise: ["Full Stack", "DevOps", "Cloud Security"],
    badges: ["Code Ninja", "Infrastructure Master", "Mentor"],
    joinedDate: "2023-09-01", status: "online",
    bio: "Full-stack developer who maintains the club's infrastructure and loves building tools.",
  },
  {
    id: 6, name: "Anna Garcia", email: "anna.garcia@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=anna",
    role: "Events Coordinator", department: "Information Technology", yearLevel: "3rd Year",
    expertise: ["Event Planning", "Community Building", "Social Media"],
    badges: ["Organizer", "Community Star"],
    joinedDate: "2024-06-01", status: "online",
    bio: "Makes sure every event runs smoothly and every member feels welcome.",
  },
  {
    id: 7, name: "Rafael Santos", email: "rafael.santos@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=rafael",
    role: "Member", department: "Computer Engineering", yearLevel: "2nd Year",
    expertise: ["Hardware Security", "IoT", "Embedded Systems"],
    badges: ["Rising Star"],
    joinedDate: "2025-06-15", status: "online",
    bio: "Interested in the intersection of hardware and cybersecurity.",
  },
  {
    id: 8, name: "Patricia Reyes", email: "patricia.reyes@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=patricia",
    role: "Member", department: "Computer Science", yearLevel: "2nd Year",
    expertise: ["Cryptography", "Mathematics", "Research"],
    badges: ["Scholar"],
    joinedDate: "2025-06-15", status: "offline",
    bio: "Fascinated by the math behind encryption and working on a research paper.",
  },
  {
    id: 9, name: "Daniel Villanueva", email: "daniel.v@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=daniel",
    role: "Member", department: "Information Technology", yearLevel: "1st Year",
    expertise: ["Linux", "Networking", "Scripting"],
    badges: ["Newcomer"],
    joinedDate: "2026-01-10", status: "away",
    bio: "Freshman eager to learn everything about cybersecurity!",
  },
  {
    id: 10, name: "Isabelle Tan", email: "isabelle.tan@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=isabelle",
    role: "Member", department: "Computer Science", yearLevel: "3rd Year",
    expertise: ["Malware Analysis", "Digital Forensics", "Incident Response"],
    badges: ["CTF Champion", "Forensics Expert"],
    joinedDate: "2024-06-01", status: "online",
    bio: "Digital forensics enthusiast who loves solving puzzles and analyzing malware.",
  },
  {
    id: 11, name: "Marco Dela Cruz", email: "marco.dc@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=marco",
    role: "Member", department: "Computer Engineering", yearLevel: "2nd Year",
    expertise: ["Mobile Security", "Android", "App Development"],
    badges: ["App Builder"],
    joinedDate: "2025-09-01", status: "offline",
    bio: "Android developer exploring mobile application security testing.",
  },
  {
    id: 12, name: "Sofia Navarro", email: "sofia.navarro@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=sofia",
    role: "Alumni", department: "Computer Science", yearLevel: "Graduate",
    expertise: ["Cloud Security", "AWS", "Compliance"],
    badges: ["Founder", "Mentor", "Alumni"],
    joinedDate: "2020-06-01", status: "offline",
    bio: "One of the original founders, now working as a Cloud Security Engineer.",
  },
];

// ============================================
// ADMIN DATA
// ============================================
export interface PendingMember {
  id: number;
  name: string;
  email: string;
  studentId: string;
  department: string;
  avatar: string;
  appliedDate: string;
}

export interface AdminActivity {
  id: number;
  type: "member_joined" | "announcement_created" | "event_created" | "thread_pinned" | "member_approved" | "resource_added";
  description: string;
  actor: string;
  actorAvatar: string;
  timestamp: string;
}

export const pendingMembers: PendingMember[] = [
  { id: 101, name: "Kevin Ramos", email: "kevin.ramos@uni.edu", studentId: "2026-00456", department: "Computer Science", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=kevin", appliedDate: "2026-07-03" },
  { id: 102, name: "Maria Santos", email: "maria.santos@uni.edu", studentId: "2026-00789", department: "Information Technology", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=maria_s", appliedDate: "2026-07-02" },
  { id: 103, name: "James Lim", email: "james.lim@uni.edu", studentId: "2026-01012", department: "Computer Engineering", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=james", appliedDate: "2026-07-01" },
];

export const recentAdminActivity: AdminActivity[] = [
  { id: 1, type: "member_joined", description: "Daniel Villanueva joined the club", actor: "System", actorAvatar: "", timestamp: "2 hours ago" },
  { id: 2, type: "announcement_created", description: "Posted 'Recruitment Drive 2026' announcement", actor: "Alex Reyes", actorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex", timestamp: "5 hours ago" },
  { id: 3, type: "event_created", description: "Created 'Web Security Workshop' event", actor: "Samantha Cruz", actorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=samantha", timestamp: "1 day ago" },
  { id: 4, type: "thread_pinned", description: "Pinned 'Best resources for learning RE' thread", actor: "Alex Reyes", actorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex", timestamp: "1 day ago" },
  { id: 5, type: "member_approved", description: "Approved Marco Dela Cruz's membership", actor: "Alex Reyes", actorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex", timestamp: "2 days ago" },
  { id: 6, type: "resource_added", description: "Added 'OWASP Testing Guide v5' resource", actor: "Carlos Mendoza", actorAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos", timestamp: "3 days ago" },
];
