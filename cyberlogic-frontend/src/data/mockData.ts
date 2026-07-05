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
  image?: string;
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
// Announcements and Events mock arrays have been removed since they are now loaded dynamically from the database.

// ============================================
// RESOURCES
// ============================================
export const resources: Resource[] = [
  {
    id: 1,
    title: "Python Automation Toolkit",
    description:
      "Scripts and tools for automating common repetitive tasks with Python.",
    category: "Tools",
    icon: "code",
    link: "#",
    downloadCount: 234,
  },
  {
    id: 2,
    title: "PC Troubleshooting Guide",
    description: "Comprehensive guide covering PC assembly, hardware maintenance, and troubleshooting.",
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
    title: "UI/UX Design Starter Kit",
    description: "Curated resources, design tools, and templates for UI/UX and graphic design.",
    category: "Links",
    icon: "external-link",
    link: "#",
    downloadCount: 567,
  },
  {
    id: 5,
    title: "Linux & CLI Command Cheat Sheet",
    description: "Essential terminal and command line cheat sheet for all tech students.",
    category: "Tutorials",
    icon: "terminal",
    link: "#",
    downloadCount: 789,
  },
  {
    id: 6,
    title: "Git & GitHub Collaboration Guide",
    description: "Step-by-step tutorial for version control and collaborating on team projects.",
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
    bio: "4th year CS student passionate about hardware servicing and open-source software.",
  },
  {
    id: 2,
    name: "Samantha Cruz",
    role: "Vice President",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=samantha",
    bio: "Specializes in UI/UX design and leads our digital creative projects.",
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
  reputation?: {
    week: number;
    month: number;
    year: number;
    allTime: number;
  };
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
    reputation: { week: 120, month: 450, year: 2300, allTime: 4500 }
  },
  {
    id: 2, name: "Samantha Cruz", email: "sam.cruz@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=samantha",
    role: "Vice President", department: "Information Technology", yearLevel: "4th Year",
    expertise: ["Web Security", "OWASP", "Bug Bounty"],
    badges: ["CTF Champion", "Speaker", "Top Contributor"],
    joinedDate: "2023-06-01", status: "online",
    bio: "Web security specialist who loves breaking (and fixing) web applications.",
    reputation: { week: 150, month: 380, year: 2100, allTime: 4200 }
  },
  {
    id: 3, name: "Miguel Torres", email: "miguel.torres@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=miguel",
    role: "Secretary", department: "Computer Science", yearLevel: "3rd Year",
    expertise: ["Documentation", "Python", "Automation"],
    badges: ["Organizer", "Helper"],
    joinedDate: "2024-01-15", status: "away",
    bio: "Keeps the club organized and automates everything he can with Python.",
    reputation: { week: 80, month: 290, year: 1500, allTime: 2100 }
  },
  {
    id: 4, name: "Jessica Lim", email: "jessica.lim@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=jessica",
    role: "Treasurer", department: "Accountancy", yearLevel: "3rd Year",
    expertise: ["Finance", "Project Management", "Risk Analysis"],
    badges: ["Organizer"],
    joinedDate: "2024-01-15", status: "offline",
    bio: "Manages club finances and ensures we get the best value for our events.",
    reputation: { week: 40, month: 150, year: 980, allTime: 1400 }
  },
  {
    id: 5, name: "Carlos Mendoza", email: "carlos.mendoza@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=carlos",
    role: "Tech Lead", department: "Computer Science", yearLevel: "4th Year",
    expertise: ["Full Stack", "DevOps", "Cloud Security"],
    badges: ["Code Ninja", "Infrastructure Master", "Mentor"],
    joinedDate: "2023-09-01", status: "online",
    bio: "Full-stack developer who maintains the club's infrastructure and loves building tools.",
    reputation: { week: 210, month: 520, year: 2500, allTime: 3800 }
  },
  {
    id: 6, name: "Anna Garcia", email: "anna.garcia@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=anna",
    role: "Events Coordinator", department: "Information Technology", yearLevel: "3rd Year",
    expertise: ["Event Planning", "Community Building", "Social Media"],
    badges: ["Organizer", "Community Star"],
    joinedDate: "2024-06-01", status: "online",
    bio: "Makes sure every event runs smoothly and every member feels welcome.",
    reputation: { week: 90, month: 310, year: 1600, allTime: 2300 }
  },
  {
    id: 7, name: "Rafael Santos", email: "rafael.santos@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=rafael",
    role: "Member", department: "Computer Engineering", yearLevel: "2nd Year",
    expertise: ["Hardware Servicing", "IoT", "Embedded Systems"],
    badges: ["Rising Star"],
    joinedDate: "2025-06-15", status: "online",
    bio: "Interested in the intersection of hardware troubleshooting and IoT systems.",
    reputation: { week: 130, month: 240, year: 820, allTime: 950 }
  },
  {
    id: 8, name: "Patricia Reyes", email: "patricia.reyes@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=patricia",
    role: "Member", department: "Computer Science", yearLevel: "2nd Year",
    expertise: ["Cryptography", "Mathematics", "Research"],
    badges: ["Scholar"],
    joinedDate: "2025-06-15", status: "offline",
    bio: "Fascinated by the math behind encryption and working on a research paper.",
    reputation: { week: 70, month: 280, year: 1200, allTime: 1350 }
  },
  {
    id: 9, name: "Daniel Villanueva", email: "daniel.v@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=daniel",
    role: "Member", department: "Information Technology", yearLevel: "1st Year",
    expertise: ["Linux", "Networking", "Scripting"],
    badges: ["Newcomer"],
    joinedDate: "2026-01-10", status: "away",
    bio: "Freshman eager to learn everything about computers and digital technology!",
    reputation: { week: 180, month: 210, year: 310, allTime: 310 }
  },
  {
    id: 10, name: "Isabelle Tan", email: "isabelle.tan@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=isabelle",
    role: "Member", department: "Computer Science", yearLevel: "3rd Year",
    expertise: ["Digital Design", "UI/UX", "Graphic Design"],
    badges: ["Design Champion", "UI/UX Expert"],
    joinedDate: "2024-06-01", status: "online",
    bio: "Digital creative who loves solving puzzles and designing sleek user interfaces.",
    reputation: { week: 95, month: 340, year: 1750, allTime: 2850 }
  },
  {
    id: 11, name: "Marco Dela Cruz", email: "marco.dc@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=marco",
    role: "Member", department: "Computer Engineering", yearLevel: "2nd Year",
    expertise: ["Mobile Security", "Android", "App Development"],
    badges: ["App Builder"],
    joinedDate: "2025-09-01", status: "offline",
    bio: "Android developer exploring mobile application security testing.",
    reputation: { week: 110, month: 190, year: 560, allTime: 560 }
  },
  {
    id: 12, name: "Sofia Navarro", email: "sofia.navarro@uni.edu",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=sofia",
    role: "Alumni", department: "Computer Science", yearLevel: "Graduate",
    expertise: ["Cloud Security", "AWS", "Compliance"],
    badges: ["Founder", "Mentor", "Alumni"],
    joinedDate: "2020-06-01", status: "offline",
    bio: "One of the original founders, now working as a Cloud Security Engineer.",
    reputation: { week: 10, month: 40, year: 600, allTime: 5200 }
  }
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
