import { apiRequest } from "../context/AuthContext";
import type { Announcement } from "../data/mockData";

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
    sections: a.sections || []
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
    sections: a.sections || []
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
      sections: data.sections
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
      sections: data.sections
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
