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
