import { apiRequest } from "../context/AuthContext";
import type { Announcement, Event, BlogPost, Resource } from "../data/mockData";

/**
 * GET /api/announcements
 * Retrieve all announcements from the Laravel backend.
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await apiRequest("/api/announcements");
  if (!res.ok) {
    throw new Error("Failed to load announcements from database.");
  }
  const data = await res.json();
  // Map snake_case author_avatar database field to camelCase authorAvatar frontend expects
  return data.map((a: any) => ({
    id: a.id,
    title: a.title,
    subtitle: a.subtitle,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    author: a.author,
    authorAvatar: a.author_avatar,
    date: a.date,
    pinned: !!a.pinned,
    sections: a.sections || [],
    image: a.image
  }));
}

/**
 * GET /api/announcements/{id}
 * Retrieve detailed blog info for a specific post.
 */
export async function fetchAnnouncementById(id: number): Promise<Announcement> {
  const res = await apiRequest(`/api/announcements/${id}`);
  if (!res.ok) {
    throw new Error("Announcement not found in database.");
  }
  const a = await res.json();
  return {
    id: a.id,
    title: a.title,
    subtitle: a.subtitle,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    author: a.author,
    authorAvatar: a.author_avatar,
    date: a.date,
    pinned: !!a.pinned,
    sections: a.sections || [],
    image: a.image
  };
}

/**
 * POST /api/announcements
 * Publish a new template layout announcement.
 */
export async function createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
  const res = await apiRequest("/api/announcements", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      subtitle: data.subtitle,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      author: data.author,
      pinned: data.pinned,
      sections: data.sections,
      image: data.image
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to publish announcement.");
  }

  return res.json();
}

/**
 * PUT /api/announcements/{id}
 * Update an existing announcement.
 */
export async function updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement> {
  const res = await apiRequest(`/api/announcements/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title: data.title,
      subtitle: data.subtitle,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      author: data.author,
      pinned: data.pinned,
      sections: data.sections,
      image: data.image
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to update announcement.");
  }

  return res.json();
}

/**
 * DELETE /api/announcements/{id}
 * Securely delete an announcement.
 */
export async function deleteAnnouncement(id: number): Promise<void> {
  const res = await apiRequest(`/api/announcements/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to delete announcement.");
  }
}

/**
 * POST /api/announcements/upload-image
 * Uploads an image (JPG, PNG, WEBP) to the Laravel backend.
 * Checks file types, size limits (5MB), and gets back a public URL.
 */
export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiRequest("/api/announcements/upload-image", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Image upload rejected by server.");
  }

  const data = await res.json();
  return data.url; // Returns public storage URL
}

/**
 * GET /api/blogs
 * Retrieve all blog posts. If showAll is true, requests status=all (for management).
 */
export async function fetchBlogs(showAll = false): Promise<BlogPost[]> {
  const url = showAll ? "/api/blogs?status=all" : "/api/blogs";
  const res = await apiRequest(url);
  if (!res.ok) {
    throw new Error("Failed to load blog posts from database.");
  }
  const data = await res.json();
  return data.map((b: any) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    excerpt: b.excerpt,
    content: b.content,
    category: b.category,
    author: b.author,
    authorAvatar: b.author_avatar,
    date: b.date,
    tags: b.tags || [],
    featured: !!b.featured,
    status: b.status,
    sections: b.sections || [],
    image: b.image,
    readTime: b.read_time
  }));
}

/**
 * GET /api/blogs/{id}
 * Retrieve detailed blog post info.
 */
export async function fetchBlogById(id: number): Promise<BlogPost> {
  const res = await apiRequest(`/api/blogs/${id}`);
  if (!res.ok) {
    throw new Error("Blog post not found in database.");
  }
  const b = await res.json();
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    excerpt: b.excerpt,
    content: b.content,
    category: b.category,
    author: b.author,
    authorAvatar: b.author_avatar,
    date: b.date,
    tags: b.tags || [],
    featured: !!b.featured,
    status: b.status,
    sections: b.sections || [],
    image: b.image,
    readTime: b.read_time
  };
}

/**
 * POST /api/blogs
 * Create a new blog post.
 */
export async function createBlog(data: Partial<BlogPost>): Promise<BlogPost> {
  const res = await apiRequest("/api/blogs", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      subtitle: data.subtitle,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      author: data.author,
      featured: data.featured,
      status: data.status,
      sections: data.sections,
      tags: data.tags,
      image: data.image,
      read_time: data.readTime
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to publish blog post.");
  }

  return res.json();
}

/**
 * PUT /api/blogs/{id}
 * Update an existing blog post.
 */
export async function updateBlog(id: number, data: Partial<BlogPost>): Promise<BlogPost> {
  const res = await apiRequest(`/api/blogs/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title: data.title,
      subtitle: data.subtitle,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      author: data.author,
      featured: data.featured,
      status: data.status,
      sections: data.sections,
      tags: data.tags,
      image: data.image,
      read_time: data.readTime
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to update blog post.");
  }

  return res.json();
}

/**
 * DELETE /api/blogs/{id}
 * Securely delete a blog post.
 */
export async function deleteBlog(id: number): Promise<void> {
  const res = await apiRequest(`/api/blogs/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to delete blog post.");
  }
}

/**
 * POST /api/blogs/upload-image
 * Uploads an image (JPG, PNG, WEBP) to the Laravel backend for blogs.
 */
export async function uploadBlogImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiRequest("/api/blogs/upload-image", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Image upload rejected by server.");
  }

  const data = await res.json();
  return data.url;
}

/**
 * POST /api/user/avatar
 * Uploads a profile picture (JPG, PNG, WEBP, GIF) to the Laravel backend.
 */
export async function uploadAvatar(file: File): Promise<{ user: any; message: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiRequest("/api/user/avatar", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Profile picture upload failed.");
  }

  return res.json();
}

export interface DbUser {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  name: string;
  email: string;
  avatar: string;
  role: "member" | "officer" | "admin" | "superadmin";
  joinedDate: string;
  school_id: string;
  year_level?: string;
  department?: string;
  address?: string;
  birthday?: string;
  status?: "pending" | "approved" | "rejected";
  admin_position?: string;
  bio?: string;
  expertise?: string;
}

/**
 * GET /api/users
 * Retrieve all registered users.
 */
export async function fetchUsers(): Promise<DbUser[]> {
  const res = await apiRequest("/api/users");
  if (!res.ok) {
    throw new Error("Failed to load members directory from database.");
  }
  return res.json();
}

/**
 * PUT /api/users/{id}/role
 * Update user role (Super Admin only).
 */
export async function updateUserRole(userId: number, role: string): Promise<DbUser> {
  const res = await apiRequest(`/api/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to update member role on server.");
  }

  const data = await res.json();
  return data.user;
}

/**
 * PUT /api/users/{id}/approve
 * Approve a pending user registration.
 */
export async function approveUser(userId: number): Promise<DbUser> {
  const res = await apiRequest(`/api/users/${userId}/approve`, {
    method: "PUT",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to approve user on server.");
  }

  const data = await res.json();
  return data.user;
}

/**
 * DELETE /api/users/{id}
 * Reject and delete a registration request.
 */
export async function rejectUser(userId: number): Promise<void> {
  const res = await apiRequest(`/api/users/${userId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to reject user on server.");
  }
}

/**
 * GET /api/events
 * Fetch all events.
 */
export async function fetchEvents(): Promise<Event[]> {
  const res = await apiRequest("/api/events");
  if (!res.ok) {
    throw new Error("Failed to load events from database.");
  }
  const data = await res.json();
  return data.map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    startTime: e.start_time,
    endTime: e.end_time,
    location: e.location,
    type: e.type,
    image: e.image,
    capacity: e.capacity,
    attendees: e.attendees,
    isRegistered: !!e.is_registered,
    sections: e.sections || [],
    status: e.status,
    eventMode: e.event_mode,
    attendanceCapacity: e.attendance_capacity,
    registrationStart: e.registration_start,
    registrationEnd: e.registration_end,
    attendanceStart: e.attendance_start,
    attendanceEnd: e.attendance_end,
    attendanceCount: e.attendance_count,
    isAttended: !!e.is_attended
  }));
}

/**
 * GET /api/events/{id}
 * Fetch a single event.
 */
export async function fetchEventById(id: number): Promise<Event> {
  const res = await apiRequest(`/api/events/${id}`);
  if (!res.ok) {
    throw new Error("Event not found in database.");
  }
  const e = await res.json();
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    startTime: e.start_time,
    endTime: e.end_time,
    location: e.location,
    type: e.type,
    image: e.image,
    capacity: e.capacity,
    attendees: e.attendees,
    isRegistered: !!e.is_registered,
    sections: e.sections || [],
    status: e.status,
    eventMode: e.event_mode,
    attendanceCapacity: e.attendance_capacity,
    registrationStart: e.registration_start,
    registrationEnd: e.registration_end,
    attendanceStart: e.attendance_start,
    attendanceEnd: e.attendance_end,
    attendanceCount: e.attendance_count,
    isAttended: !!e.is_attended
  };
}

/**
 * POST /api/events
 * Create a new event.
 */
export async function createEvent(data: Partial<Event>): Promise<Event> {
  const res = await apiRequest("/api/events", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      location: data.location,
      type: data.type,
      image: data.image,
      capacity: data.capacity,
      sections: data.sections,
      status: data.status,
      event_mode: data.eventMode,
      attendance_capacity: data.attendanceCapacity,
      registration_start: data.registrationStart,
      registration_end: data.registrationEnd,
      attendance_start: data.attendanceStart,
      attendance_end: data.attendanceEnd
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to create event.");
  }

  return res.json();
}

/**
 * PUT /api/events/{id}
 * Update an existing event.
 */
export async function updateEvent(id: number, data: Partial<Event>): Promise<Event> {
  const res = await apiRequest(`/api/events/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      location: data.location,
      type: data.type,
      image: data.image,
      capacity: data.capacity,
      sections: data.sections,
      status: data.status,
      event_mode: data.eventMode,
      attendance_capacity: data.attendanceCapacity,
      registration_start: data.registrationStart,
      registration_end: data.registrationEnd,
      attendance_start: data.attendanceStart,
      attendance_end: data.attendanceEnd
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to update event.");
  }

  return res.json();
}

/**
 * DELETE /api/events/{id}
 * Delete an event.
 */
export async function deleteEvent(id: number): Promise<void> {
  const res = await apiRequest(`/api/events/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to delete event.");
  }
}

/**
 * POST /api/events/{id}/register
 * Register the user for an event (RSVP).
 */
export async function registerForEvent(id: number): Promise<{ attendees: number; isRegistered: boolean }> {
  const res = await apiRequest(`/api/events/${id}/register`, {
    method: "POST"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to register for event.");
  }

  const data = await res.json();
  return {
    attendees: data.attendees,
    isRegistered: !!data.is_registered
  };
}

/**
 * POST /api/events/{id}/unregister
 * Cancel the user's registration for an event.
 */
export async function unregisterFromEvent(id: number): Promise<{ attendees: number; isRegistered: boolean }> {
  const res = await apiRequest(`/api/events/${id}/unregister`, {
    method: "POST"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to cancel event registration.");
  }

  const data = await res.json();
  return {
    attendees: data.attendees,
    isRegistered: !!data.is_registered
  };
}

/**
 * GET /api/events/{id}/attendance-qr
 * Fetch attendance QR token.
 */
export async function fetchAttendanceQr(id: number): Promise<string> {
  const res = await apiRequest(`/api/events/${id}/attendance-qr`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to generate attendance QR code.");
  }
  const data = await res.json();
  return data.qr_token;
}

/**
 * POST /api/events/{id}/check-in
 * Submit a scanned QR token to check in.
 */
export async function checkInAttendee(id: number, qrToken: string): Promise<any> {
  const res = await apiRequest(`/api/events/${id}/check-in`, {
    method: "POST",
    body: JSON.stringify({ qr_token: qrToken })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to check in attendee.");
  }
  return res.json();
}

/**
 * GET /api/events/{id}/attendees
 * Fetch checked-in attendees and registrations.
 */
export async function fetchEventAttendees(id: number): Promise<{ attendees: any[]; registrations: any[] }> {
  const res = await apiRequest(`/api/events/${id}/attendees`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to retrieve attendees list.");
  }
  return res.json();
}

/**
 * PUT /api/events/{id}/status
 * Update event status.
 */
export async function updateEventStatus(id: number, status: string): Promise<{ success: boolean; status: string; message: string }> {
  const res = await apiRequest(`/api/events/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update event status.");
  }
  return res.json();
}

/**
 * Formats startTime and endTime (format HH:mm) to a readable AM/PM range string.
 */
export function formatEventTime(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return "TBD";
  
  const parseTime = (timeStr: string) => {
    const [hoursStr, minutesStr] = timeStr.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesFormatted = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesFormatted} ${ampm}`;
  };

  try {
    return `${parseTime(startTime)} - ${parseTime(endTime)}`;
  } catch (err) {
    return `${startTime} - ${endTime}`;
  }
}

// ============================================
// FORUM API TYPES
// ============================================

export interface DbForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  type: "discussion" | "support";
  icon: string | null;
  is_visible: boolean;
  allow_solved: boolean;
  rules: string | null;
  threadCount: number;
}

export interface ForumCategoryMapped {
  id: string; // slug-based id for frontend compatibility
  name: string;
  description: string;
  threadCount: number;
  color: string;
  type: "discussion" | "support";
  icon: string | null;
  is_visible: boolean;
  allow_solved: boolean;
  rules: string | null;
  dbId: number;
}

export interface ForumThreadMapped {
  id: number;
  title: string;
  categoryId: string; // maps to category.slug
  author: string;
  authorAvatar: string;
  authorRole: string;
  authorId: number;
  content: string;
  replyCount: number;
  likes: number;
  views: number;
  lastActivity: string;
  createdAt: string;
  pinned: boolean;
  solved: boolean;
  closed: boolean;
  solutionCommentId: number | null;
  userVote: number | null;
  categoryDbId: number;
  images: string[] | null;
  isSpoiler: boolean;
  isRedacted: boolean;
  animate?: string;
  voteAnimate?: string;
  category?: {
    name: string;
    color: string;
    slug: string;
  } | null;
  poll?: ForumPollMapped | null;
}

export interface ForumPollOptionMapped {
  id: number;
  optionText: string;
  votesCount: number;
}

export interface ForumPollMapped {
  id: number;
  question: string;
  isClosed: boolean;
  options: ForumPollOptionMapped[];
  userVotedOptionId: number | null;
  totalVotes: number;
}

export interface ForumCommentMapped {
  id: number;
  threadId: number;
  author: string;
  authorAvatar: string;
  authorRole: string;
  authorId: number;
  parentId: number | null;
  content: string;
  likes: number;
  createdAt: string;
  isBestAnswer: boolean;
  userVote: number | null;
  isSpoiler: boolean;
  isRedacted: boolean;
  animate?: string;
  voteAnimate?: string;
}

// Helper to format relative times
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${diffDays}d ago`;
}

// Helper to capitalize first letter of roles
function formatRole(role: string): string {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// ============================================
// FORUM API ACTIONS
// ============================================

/**
 * GET /api/forum/categories
 */
export async function fetchForumCategories(): Promise<ForumCategoryMapped[]> {
  const res = await apiRequest("/api/forum/categories");
  if (!res.ok) {
    throw new Error("Failed to load forum categories.");
  }
  const data: DbForumCategory[] = await res.json();
  return data.map((c) => ({
    id: c.slug,
    name: c.name,
    description: c.description || "",
    threadCount: c.threadCount,
    color: c.color,
    type: c.type,
    icon: c.icon,
    is_visible: c.is_visible,
    allow_solved: c.allow_solved,
    rules: c.rules,
    dbId: c.id
  }));
}

/**
 * GET /api/forum/threads
 */
export async function fetchForumThreads(params?: {
  category?: string;
  q?: string;
  sort?: string;
  userId?: number;
}): Promise<ForumThreadMapped[]> {
  const urlParams = new URLSearchParams();
  if (params?.category) urlParams.append("category", params.category);
  if (params?.q) urlParams.append("q", params.q);
  if (params?.sort) urlParams.append("sort", params.sort);
  if (params?.userId) urlParams.append("user_id", String(params.userId));

  const queryString = urlParams.toString();
  const res = await apiRequest(`/api/forum/threads?${queryString}`);
  if (!res.ok) {
    throw new Error("Failed to load forum threads.");
  }
  const data: any[] = await res.json();
  return data.map((t) => ({
    id: t.id,
    title: t.title,
    categoryId: t.category?.slug || "general",
    category: t.category ? {
      name: t.category.name,
      color: t.category.color || "primary",
      slug: t.category.slug
    } : null,
    author: t.user?.name || "Anonymous",
    authorAvatar: t.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(t.user?.role),
    authorId: t.user_id,
    content: t.content,
    replyCount: t.commentCount,
    likes: t.voteScore,
    views: t.views,
    lastActivity: formatRelativeTime(t.updated_at),
    createdAt: formatRelativeTime(t.created_at),
    pinned: !!t.is_pinned,
    solved: !!t.is_solved,
    closed: !!t.is_closed,
    solutionCommentId: t.solution_comment_id,
    userVote: t.userVote,
    categoryDbId: t.category_id,
    images: t.images || null,
    isSpoiler: !!t.is_spoiler,
    isRedacted: !!t.is_redacted,
    poll: mapPoll(t.poll)
  }));
}

/**
 * GET /api/forum/threads/{id}
 */
export async function fetchForumThread(id: number): Promise<ForumThreadMapped> {
  const res = await apiRequest(`/api/forum/threads/${id}`);
  if (!res.ok) {
    throw new Error("Failed to load forum thread.");
  }
  const t = await res.json();
  return {
    id: t.id,
    title: t.title,
    categoryId: t.category?.slug || "general",
    category: t.category ? {
      name: t.category.name,
      color: t.category.color || "primary",
      slug: t.category.slug
    } : null,
    author: t.user?.name || "Anonymous",
    authorAvatar: t.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(t.user?.role),
    authorId: t.user_id,
    content: t.content,
    replyCount: t.commentCount,
    likes: t.voteScore,
    views: t.views,
    lastActivity: formatRelativeTime(t.updated_at),
    createdAt: formatRelativeTime(t.created_at),
    pinned: !!t.is_pinned,
    solved: !!t.is_solved,
    closed: !!t.is_closed,
    solutionCommentId: t.solution_comment_id,
    userVote: t.userVote,
    categoryDbId: t.category_id,
    images: t.images || null,
    isSpoiler: !!t.is_spoiler,
    isRedacted: !!t.is_redacted,
    poll: mapPoll(t.poll)
  };
}

/**
 * POST /api/forum/threads
 */
export async function createForumThread(data: FormData): Promise<ForumThreadMapped> {
  const res = await apiRequest("/api/forum/threads", {
    method: "POST",
    body: data
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to create thread.");
  }

  const t = await res.json();
  return {
    id: t.id,
    title: t.title,
    categoryId: t.category?.slug || "general",
    author: t.user?.name || "Anonymous",
    authorAvatar: t.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(t.user?.role),
    authorId: t.user_id,
    content: t.content,
    replyCount: t.commentCount,
    likes: t.voteScore,
    views: t.views,
    lastActivity: formatRelativeTime(t.updated_at),
    createdAt: formatRelativeTime(t.created_at),
    pinned: !!t.is_pinned,
    solved: !!t.is_solved,
    closed: !!t.is_closed,
    solutionCommentId: t.solution_comment_id,
    userVote: t.userVote,
    categoryDbId: t.category_id,
    images: t.images || null,
    isSpoiler: !!t.is_spoiler,
    isRedacted: !!t.is_redacted,
    poll: mapPoll(t.poll)
  };
}

/**
 * PUT /api/forum/threads/{id}
 */
export async function updateForumThread(
  id: number,
  data: { title: string; content: string; category_id: number }
): Promise<ForumThreadMapped> {
  const res = await apiRequest(`/api/forum/threads/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to update thread.");
  }

  const t = await res.json();
  return {
    id: t.id,
    title: t.title,
    categoryId: t.category?.slug || "general",
    author: t.user?.name || "Anonymous",
    authorAvatar: t.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(t.user?.role),
    authorId: t.user_id,
    content: t.content,
    replyCount: t.commentCount,
    likes: t.voteScore,
    views: t.views,
    lastActivity: formatRelativeTime(t.updated_at),
    createdAt: formatRelativeTime(t.created_at),
    pinned: !!t.is_pinned,
    solved: !!t.is_solved,
    closed: !!t.is_closed,
    solutionCommentId: t.solution_comment_id,
    userVote: t.userVote,
    categoryDbId: t.category_id,
    images: t.images || null,
    isSpoiler: !!t.is_spoiler,
    isRedacted: !!t.is_redacted,
    poll: mapPoll(t.poll)
  };
}

/**
 * DELETE /api/forum/threads/{id}
 */
export async function deleteForumThread(id: number): Promise<void> {
  const res = await apiRequest(`/api/forum/threads/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to delete thread.");
  }
}

/**
 * PUT /api/forum/threads/{id}/pin
 */
export async function toggleThreadPin(id: number): Promise<ForumThreadMapped> {
  const res = await apiRequest(`/api/forum/threads/${id}/pin`, {
    method: "PUT"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to toggle pin.");
  }

  const t = await res.json();
  return {
    id: t.id,
    title: t.title,
    categoryId: t.category?.slug || "general",
    author: t.user?.name || "Anonymous",
    authorAvatar: t.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(t.user?.role),
    authorId: t.user_id,
    content: t.content,
    replyCount: t.commentCount,
    likes: t.voteScore,
    views: t.views,
    lastActivity: formatRelativeTime(t.updated_at),
    createdAt: formatRelativeTime(t.created_at),
    pinned: !!t.is_pinned,
    solved: !!t.is_solved,
    closed: !!t.is_closed,
    solutionCommentId: t.solution_comment_id,
    userVote: t.userVote,
    categoryDbId: t.category_id,
    images: t.images || null,
    isSpoiler: !!t.is_spoiler,
    isRedacted: !!t.is_redacted
  };
}

/**
 * PUT /api/forum/threads/{id}/close
 */
export async function toggleThreadClose(id: number): Promise<ForumThreadMapped> {
  const res = await apiRequest(`/api/forum/threads/${id}/close`, {
    method: "PUT"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to toggle close status.");
  }

  const t = await res.json();
  return {
    id: t.id,
    title: t.title,
    categoryId: t.category?.slug || "general",
    author: t.user?.name || "Anonymous",
    authorAvatar: t.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(t.user?.role),
    authorId: t.user_id,
    content: t.content,
    replyCount: t.commentCount,
    likes: t.voteScore,
    views: t.views,
    lastActivity: formatRelativeTime(t.updated_at),
    createdAt: formatRelativeTime(t.created_at),
    pinned: !!t.is_pinned,
    solved: !!t.is_solved,
    closed: !!t.is_closed,
    solutionCommentId: t.solution_comment_id,
    userVote: t.userVote,
    categoryDbId: t.category_id,
    images: t.images || null,
    isSpoiler: !!t.is_spoiler,
    isRedacted: !!t.is_redacted
  };
}

/**
 * PUT /api/forum/threads/{id}/solve
 */
export async function toggleThreadSolve(id: number, commentId: number | null): Promise<ForumThreadMapped> {
  const res = await apiRequest(`/api/forum/threads/${id}/solve`, {
    method: "PUT",
    body: JSON.stringify({ comment_id: commentId })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to set solved status.");
  }

  const t = await res.json();
  return {
    id: t.id,
    title: t.title,
    categoryId: t.category?.slug || "general",
    author: t.user?.name || "Anonymous",
    authorAvatar: t.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(t.user?.role),
    authorId: t.user_id,
    content: t.content,
    replyCount: t.commentCount,
    likes: t.voteScore,
    views: t.views,
    lastActivity: formatRelativeTime(t.updated_at),
    createdAt: formatRelativeTime(t.created_at),
    pinned: !!t.is_pinned,
    solved: !!t.is_solved,
    closed: !!t.is_closed,
    solutionCommentId: t.solution_comment_id,
    userVote: t.userVote,
    categoryDbId: t.category_id,
    images: t.images || null,
    isSpoiler: !!t.is_spoiler,
    isRedacted: !!t.is_redacted
  };
}

/**
 * GET /api/forum/threads/{threadId}/comments
 */
export async function fetchForumComments(threadId: number): Promise<ForumCommentMapped[]> {
  const res = await apiRequest(`/api/forum/threads/${threadId}/comments`);
  if (!res.ok) {
    throw new Error("Failed to load comments.");
  }
  const data: any[] = await res.json();
  return data.map((c) => ({
    id: c.id,
    threadId: c.thread_id,
    author: c.user?.name || "Anonymous",
    authorAvatar: c.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(c.user?.role),
    authorId: c.user_id,
    parentId: c.parent_id,
    content: c.content,
    likes: c.voteScore,
    createdAt: formatRelativeTime(c.created_at),
    isBestAnswer: !!c.is_best_answer,
    userVote: c.userVote,
    isSpoiler: !!c.is_spoiler,
    isRedacted: !!c.is_redacted
  }));
}

/**
 * POST /api/forum/threads/{threadId}/comments
 */
export async function createForumComment(
  threadId: number,
  data: { content: string; parent_id?: number; is_spoiler?: boolean; is_redacted?: boolean }
): Promise<ForumCommentMapped> {
  const res = await apiRequest(`/api/forum/threads/${threadId}/comments`, {
    method: "POST",
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to post comment.");
  }

  const c = await res.json();
  return {
    id: c.id,
    threadId: c.thread_id,
    author: c.user?.name || "Anonymous",
    authorAvatar: c.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(c.user?.role),
    authorId: c.user_id,
    parentId: c.parent_id,
    content: c.content,
    likes: c.voteScore,
    createdAt: formatRelativeTime(c.created_at),
    isBestAnswer: !!c.is_best_answer,
    userVote: c.userVote,
    isSpoiler: !!c.is_spoiler,
    isRedacted: !!c.is_redacted
  };
}

/**
 * PUT /api/forum/comments/{id}
 */
export async function updateForumComment(
  id: number,
  data: { content: string; is_spoiler?: boolean; is_redacted?: boolean }
): Promise<ForumCommentMapped> {
  const res = await apiRequest(`/api/forum/comments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to edit comment.");
  }

  const c = await res.json();
  return {
    id: c.id,
    threadId: c.thread_id,
    author: c.user?.name || "Anonymous",
    authorAvatar: c.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    authorRole: formatRole(c.user?.role),
    authorId: c.user_id,
    parentId: c.parent_id,
    content: c.content,
    likes: c.voteScore,
    createdAt: formatRelativeTime(c.created_at),
    isBestAnswer: !!c.is_best_answer,
    userVote: c.userVote,
    isSpoiler: !!c.is_spoiler,
    isRedacted: !!c.is_redacted
  };
}

/**
 * DELETE /api/forum/comments/{id}
 */
export async function deleteForumComment(id: number): Promise<void> {
  const res = await apiRequest(`/api/forum/comments/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to delete comment.");
  }
}

/**
 * POST /api/forum/threads/{id}/vote
 */
export async function voteThread(id: number, value: 1 | -1): Promise<{ vote_score: number; user_vote: number | null }> {
  const res = await apiRequest(`/api/forum/threads/${id}/vote`, {
    method: "POST",
    body: JSON.stringify({ value })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to submit vote.");
  }

  return res.json();
}

/**
 * POST /api/forum/comments/{id}/vote
 */
export async function voteComment(
  id: number,
  value: 1 | -1
): Promise<{ vote_score: number; user_vote: number | null }> {
  const res = await apiRequest(`/api/forum/comments/${id}/vote`, {
    method: "POST",
    body: JSON.stringify({ value })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to submit vote.");
  }

  return res.json();
}

// ============================================
// ADMIN CHAT & FORUM CATEGORY MANAGEMENT API
// ============================================

export interface DbChatChannel {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: 'group' | 'dm';
  icon: string | null;
  grouping: string;
  sort_order: number;
  allowed_roles: string[] | null;
  write_roles: string[] | null;
  is_archived: boolean;
  messageCount: number;
}

export interface DbForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  type: 'discussion' | 'support';
  icon: string | null;
  is_visible: boolean;
  allow_solved: boolean;
  rules: string | null;
  sort_order: number;
  threadCount: number;
  solvedThreadCount: number;
}

/**
 * POST /api/admin/chat/channels
 */
export async function createChatChannel(data: {
  name: string;
  description?: string;
  type: string;
  icon?: string;
  grouping: string;
  allowed_roles?: string[];
  write_roles?: string[];
}): Promise<DbChatChannel> {
  const res = await apiRequest("/api/admin/chat/channels", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create channel.");
  }

  return res.json();
}

/**
 * PUT /api/admin/chat/channels/{id}
 */
export async function updateChatChannel(
  id: number,
  data: {
    name: string;
    description?: string;
    type: string;
    icon?: string;
    grouping: string;
    allowed_roles?: string[];
    write_roles?: string[];
    is_archived: boolean;
  }
): Promise<DbChatChannel> {
  const res = await apiRequest(`/api/admin/chat/channels/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update channel.");
  }

  return res.json();
}

/**
 * DELETE /api/admin/chat/channels/{id}
 */
export async function deleteChatChannel(id: number): Promise<{ message: string }> {
  const res = await apiRequest(`/api/admin/chat/channels/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to delete channel.");
  }

  return res.json();
}

/**
 * POST /api/admin/forum/categories
 */
export async function createForumCategory(data: {
  name: string;
  description?: string;
  color: string;
  type: string;
  icon?: string;
  is_visible: boolean;
  allow_solved: boolean;
  rules?: string;
}): Promise<DbForumCategory> {
  const res = await apiRequest("/api/admin/forum/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create category.");
  }

  return res.json();
}

/**
 * PUT /api/admin/forum/categories/{id}
 */
export async function updateForumCategory(
  id: number,
  data: {
    name: string;
    description?: string;
    color: string;
    type: string;
    icon?: string;
    is_visible: boolean;
    allow_solved: boolean;
    rules?: string;
  }
): Promise<DbForumCategory> {
  const res = await apiRequest(`/api/admin/forum/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update category.");
  }

  return res.json();
}

/**
 * DELETE /api/admin/forum/categories/{id}
 */
export async function deleteForumCategory(id: number): Promise<{ message: string }> {
  const res = await apiRequest(`/api/admin/forum/categories/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to delete category.");
  }

  return res.json();
}

/**
 * PUT /api/admin/forum/categories/reorder
 */
export async function reorderForumCategories(ids: number[]): Promise<{ message: string }> {
  const res = await apiRequest("/api/admin/forum/categories/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to reorder categories.");
  }

  return res.json();
}

/**
 * PUT /api/admin/chat/channels/reorder
 */
export async function reorderChatChannels(ids: number[]): Promise<{ message: string }> {
  const res = await apiRequest("/api/admin/chat/channels/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to reorder channels.");
  }

  return res.json();
}

/**
 * GET /api/site-settings
 */
export async function fetchSiteSettings(): Promise<Record<string, string>> {
  const res = await apiRequest("/api/site-settings");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to load site settings.");
  }
  return res.json();
}

/**
 * PUT /api/admin/site-settings
 */
export async function updateSiteSettings(settings: Record<string, string>): Promise<{ message: string; settings: Record<string, string> }> {
  const res = await apiRequest("/api/admin/site-settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to save site settings.");
  }
  return res.json();
}

export interface Officer {
  id: number;
  user_id: number | null;
  use_profile_info: boolean;
  display_name: string | null;
  display_role: string | null;
  display_bio: string | null;
  display_avatar: string | null;
  display_email: string | null;
  display_github: string | null;
  display_linkedin: string | null;
  sort_order: number;
  // Resolved attributes
  name: string;
  role: string;
  bio: string;
  avatar: string;
  email: string;
  github: string;
  linkedin: string;
  user?: DbUser;
}

/**
 * GET /api/officers
 */
export async function fetchOfficers(): Promise<Officer[]> {
  const res = await apiRequest("/api/officers");
  if (!res.ok) {
    throw new Error("Failed to load officers directory.");
  }
  return res.json();
}

/**
 * GET /api/officers/{id}
 */
export async function fetchOfficerById(id: number): Promise<Officer> {
  const res = await apiRequest(`/api/officers/${id}`);
  if (!res.ok) {
    throw new Error("Officer profile not found.");
  }
  return res.json();
}

/**
 * GET /api/admin/officers
 */
export async function fetchAdminOfficers(): Promise<Officer[]> {
  const res = await apiRequest("/api/admin/officers");
  if (!res.ok) {
    throw new Error("Failed to load admin officers list.");
  }
  return res.json();
}

/**
 * POST /api/admin/officers
 */
export async function createOfficer(data: Partial<Officer>): Promise<Officer> {
  const res = await apiRequest("/api/admin/officers", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create officer.");
  }
  return res.json();
}

/**
 * PUT /api/admin/officers/{id}
 */
export async function updateOfficer(id: number, data: Partial<Officer>): Promise<Officer> {
  const res = await apiRequest(`/api/admin/officers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update officer.");
  }
  return res.json();
}

/**
 * DELETE /api/admin/officers/{id}
 */
export async function deleteOfficer(id: number): Promise<void> {
  const res = await apiRequest(`/api/admin/officers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to delete officer.");
  }
}

/**
 * PUT /api/admin/officers/reorder
 */
export async function reorderOfficers(ids: number[]): Promise<void> {
  const res = await apiRequest("/api/admin/officers/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to reorder officers.");
  }
}

/**
 * POST /api/admin/officers/upload-avatar
 */
export async function uploadOfficerAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiRequest("/api/admin/officers/upload-avatar", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to upload avatar image.");
  }

  const result = await res.json();
  return result.url;
}

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_label: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  animate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AuditLogStats {
  total_logs: number;
  logs_today: number;
  top_actor: string;
  top_actor_count: number;
  action_summary: Array<{ action: string; total: number }>;
}

/**
 * GET /api/admin/audit-logs
 * Fetch paginated audit logs with parameters.
 */
export async function fetchAuditLogs(params?: {
  page?: number;
  per_page?: number;
  action?: string;
  entity_type?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<PaginatedResponse<AuditLogEntry>> {
  const urlParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        urlParams.append(key, String(val));
      }
    });
  }

  const res = await apiRequest(`/api/admin/audit-logs?${urlParams.toString()}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to load audit logs.");
  }
  return res.json();
}

/**
 * GET /api/admin/audit-logs/stats
 * Fetch audit logs summary statistics.
 */
export async function fetchAuditLogStats(): Promise<AuditLogStats> {
  const res = await apiRequest("/api/admin/audit-logs/stats");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to load audit log statistics.");
  }
  return res.json();
}

// ─── Permission Management ───────────────────────────────────────────────────

export interface Permission {
  id: number;
  key: string;
  label: string;
  group: string;
  description: string | null;
}

/**
 * GET /api/permissions
 * Fetch all available permissions (Superadmin only).
 */
export async function fetchPermissions(): Promise<Permission[]> {
  const res = await apiRequest("/api/permissions");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to load permissions.");
  }
  return res.json();
}

/**
 * PUT /api/users/{id}/position
 * Update an admin user's position title (Superadmin only).
 */
export async function updateUserPosition(userId: number, position: string | null): Promise<any> {
  const res = await apiRequest(`/api/users/${userId}/position`, {
    method: "PUT",
    body: JSON.stringify({ admin_position: position }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to update position.");
  }
  return res.json();
}

/**
 * PUT /api/users/{id}/permissions
 * Sync an admin user's permissions (Superadmin only).
 */
export async function updateUserPermissions(userId: number, permissionIds: number[]): Promise<any> {
  const res = await apiRequest(`/api/users/${userId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permission_ids: permissionIds }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to update permissions.");
  }
  return res.json();
}

export interface DirectoryMember {
  id: number;
  name: string;
  avatar: string;
  status: string;
  role: string;
  department: string;
  badges: string[];
  expertise: string[];
  bio: string;
  yearLevel: string;
  email: string;
  joinedDate: string;
  address?: string;
  birthday?: string;
  reputation?: {
    week: number;
    month: number;
    year: number;
    allTime: number;
  };
}

/**
 * GET /api/directory
 * Retrieve all approved members from the backend database.
 */
export async function fetchDirectory(): Promise<DirectoryMember[]> {
  const res = await apiRequest("/api/directory");
  if (!res.ok) {
    throw new Error("Failed to load directory.");
  }
  return res.json();
}

/**
 * GET /api/directory/{id}
 * Retrieve public details of a specific member by ID.
 */
export async function fetchDirectoryMemberById(id: number): Promise<DirectoryMember> {
  const res = await apiRequest(`/api/directory/${id}`);
  if (!res.ok) {
    throw new Error("Failed to load member profile details.");
  }
  return res.json();
}

// ─── Global Search ───────────────────────────────────────────────────────────

export interface SearchResultAnnouncement {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
}

export interface SearchResultForum {
  id: number;
  title: string;
  author: string;
  replyCount: number;
  likes: number;
  createdAt: string;
}

export interface SearchResultProfile {
  id: number;
  name: string;
  avatar: string;
  role: string;
  department: string;
}

export interface SearchResultBlog {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
}

export interface SearchResultEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
}

export interface SearchResults {
  announcements: SearchResultAnnouncement[];
  forums: SearchResultForum[];
  profiles: SearchResultProfile[];
  blogs: SearchResultBlog[];
  events: SearchResultEvent[];
  resources: Resource[];
}

/**
 * GET /api/search
 * Queries backend models for announcements, forums, profiles, blogs, and events.
 * Merges resources from static client-side data.
 */
/**
 * GET /api/search
 * Queries backend models for announcements, forums, profiles, blogs, events, and resources.
 */
export async function globalSearch(q: string, type = "all"): Promise<SearchResults> {
  if (!q.trim()) {
    return {
      announcements: [],
      forums: [],
      profiles: [],
      blogs: [],
      events: [],
      resources: []
    };
  }

  const urlParams = new URLSearchParams();
  urlParams.append("q", q);
  urlParams.append("type", type);

  const res = await apiRequest(`/api/search?${urlParams.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch search results from database.");
  }
  const data = await res.json();

  return {
    announcements: data.announcements || [],
    forums: data.forums || [],
    profiles: data.profiles || [],
    blogs: data.blogs || [],
    events: data.events || [],
    resources: data.resources || []
  };
}

export interface ResourceMapped {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: "Tutorials" | "Documents" | "Tools" | "Links";
  icon: string;
  link: string | null;
  file_path: string | null;
  filePathUrl: string | null;
  status: "pending" | "approved" | "rejected";
  downloadCount: number;
  voteScore: number;
  userVote: number | null;
  user?: {
    id: number;
    name: string;
    avatar: string;
    role: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

function mapResource(r: any): ResourceMapped {
  return {
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    description: r.description,
    category: r.category,
    icon: r.icon,
    link: r.link,
    file_path: r.file_path,
    filePathUrl: r.filePathUrl ?? null,
    status: r.status,
    downloadCount: r.download_count ?? 0,
    voteScore: r.voteScore ?? 0,
    userVote: r.userVote ?? null,
    user: r.user,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

/**
 * GET /api/resources
 */
export async function fetchResources(params?: { category?: string; q?: string; status?: string }): Promise<ResourceMapped[]> {
  const urlParams = new URLSearchParams();
  if (params?.category) urlParams.append("category", params.category);
  if (params?.q) urlParams.append("q", params.q);
  if (params?.status) urlParams.append("status", params.status);

  const res = await apiRequest(`/api/resources?${urlParams.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to load resources.");
  }
  const data = await res.json();
  return data.map(mapResource);
}

/**
 * GET /api/my-resources
 */
export async function fetchMyResources(): Promise<ResourceMapped[]> {
  const res = await apiRequest("/api/my-resources");
  if (!res.ok) {
    throw new Error("Failed to load your resource submissions.");
  }
  const data = await res.json();
  return data.map(mapResource);
}

/**
 * POST /api/resources
 */
export async function createResource(data: FormData): Promise<ResourceMapped> {
  const res = await apiRequest("/api/resources", {
    method: "POST",
    body: data
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to submit resource.");
  }
  const r = await res.json();
  return mapResource(r);
}

/**
 * POST /api/resources/{id} with method spoofing
 */
export async function updateResource(id: number, data: FormData): Promise<ResourceMapped> {
  data.append("_method", "PUT");
  const res = await apiRequest(`/api/resources/${id}`, {
    method: "POST",
    body: data
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to update resource.");
  }
  const r = await res.json();
  return mapResource(r);
}

/**
 * DELETE /api/resources/{id}
 */
export async function deleteResource(id: number): Promise<void> {
  const res = await apiRequest(`/api/resources/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    throw new Error("Failed to delete resource.");
  }
}

/**
 * POST /api/resources/{id}/vote
 */
export async function voteResource(id: number, value: number): Promise<{ voteScore: number; userVote: number | null }> {
  const res = await apiRequest(`/api/resources/${id}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ value })
  });
  if (!res.ok) {
    throw new Error("Failed to vote on resource.");
  }
  const data = await res.json();
  return {
    voteScore: data.vote_score,
    userVote: data.user_vote
  };
}

/**
 * PUT /api/admin/resources/{id}/approve
 */
export async function approveResource(id: number): Promise<ResourceMapped> {
  const res = await apiRequest(`/api/admin/resources/${id}/approve`, {
    method: "PUT"
  });
  if (!res.ok) {
    throw new Error("Failed to approve resource.");
  }
  const r = await res.json();
  return mapResource(r);
}

/**
 * PUT /api/admin/resources/{id}/reject
 */
export async function rejectResource(id: number): Promise<ResourceMapped> {
  const res = await apiRequest(`/api/admin/resources/${id}/reject`, {
    method: "PUT"
  });
  if (!res.ok) {
    throw new Error("Failed to reject resource.");
  }
  const r = await res.json();
  return mapResource(r);
}

export interface ReputationUser {
  id: number;
  name: string;
  avatar: string;
  role: string;
  reputation: {
    week: number;
    month: number;
    year: number;
    allTime: number;
  };
}

/**
 * GET /api/reputation/leaderboard
 */
export async function fetchReputationLeaderboard(timeframe: string): Promise<ReputationUser[]> {
  const res = await apiRequest(`/api/reputation/leaderboard?timeframe=${timeframe}`);
  if (!res.ok) {
    throw new Error("Failed to load reputation leaderboard.");
  }
  return res.json();
}

function mapPoll(p: any): ForumPollMapped | null {
  if (!p) return null;
  const totalVotes = p.options
    ? p.options.reduce((sum: number, opt: any) => sum + (opt.votes_count || (opt.votes ? opt.votes.length : 0)), 0)
    : 0;
  return {
    id: p.id,
    question: p.question,
    isClosed: !!p.is_closed,
    options: p.options
      ? p.options.map((opt: any) => ({
          id: opt.id,
          optionText: opt.option_text,
          votesCount: opt.votes_count || (opt.votes ? opt.votes.length : 0),
        }))
      : [],
    userVotedOptionId: p.user_voted_option_id || null,
    totalVotes,
  };
}

/**
 * POST /api/forum/polls/{pollId}/vote
 */
export async function voteForumPoll(pollId: number, optionId: number): Promise<ForumPollMapped> {
  const res = await apiRequest(`/api/forum/polls/${pollId}/vote`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to vote in poll.");
  }

  const p = await res.json();
  return mapPoll(p) as ForumPollMapped;
}

/**
 * PUT /api/forum/polls/{pollId}/close
 */
export async function closeForumPoll(pollId: number): Promise<ForumPollMapped> {
  const res = await apiRequest(`/api/forum/polls/${pollId}/close`, {
    method: "PUT",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || "Failed to close poll.");
  }

  const p = await res.json();
  return mapPoll(p) as ForumPollMapped;
}

export interface ClubStats {
  members: number;
  events: number;
  projects: number;
  awards: number;
}

/**
 * GET /api/club-stats
 */
export async function fetchClubStats(): Promise<ClubStats> {
  const res = await apiRequest("/api/club-stats");
  if (!res.ok) {
    throw new Error("Failed to load club statistics.");
  }
  return res.json();
}

