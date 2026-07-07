import { apiRequest } from "../context/AuthContext";
import type { Announcement, Event } from "../data/mockData";

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
    sections: e.sections || []
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
    sections: e.sections || []
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
      sections: data.sections
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
      sections: data.sections
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
  threadCount: number;
}

export interface ForumCategoryMapped {
  id: string; // slug-based id for frontend compatibility
  name: string;
  description: string;
  threadCount: number;
  color: string;
  type: "discussion" | "support";
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
}): Promise<ForumThreadMapped[]> {
  const urlParams = new URLSearchParams();
  if (params?.category) urlParams.append("category", params.category);
  if (params?.q) urlParams.append("q", params.q);
  if (params?.sort) urlParams.append("sort", params.sort);

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
    categoryDbId: t.category_id
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
    categoryDbId: t.category_id
  };
}

/**
 * POST /api/forum/threads
 */
export async function createForumThread(data: {
  title: string;
  content: string;
  category_id: number;
}): Promise<ForumThreadMapped> {
  const res = await apiRequest("/api/forum/threads", {
    method: "POST",
    body: JSON.stringify(data)
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
    categoryDbId: t.category_id
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
    categoryDbId: t.category_id
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
    categoryDbId: t.category_id
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
    categoryDbId: t.category_id
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
    categoryDbId: t.category_id
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
    userVote: c.userVote
  }));
}

/**
 * POST /api/forum/threads/{threadId}/comments
 */
export async function createForumComment(
  threadId: number,
  data: { content: string; parent_id?: number }
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
    userVote: c.userVote
  };
}

/**
 * PUT /api/forum/comments/{id}
 */
export async function updateForumComment(id: number, data: { content: string }): Promise<ForumCommentMapped> {
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
    userVote: c.userVote
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
