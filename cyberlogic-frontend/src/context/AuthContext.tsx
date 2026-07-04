import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface User {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  name: string;
  email: string;
  avatar: string;
  role: "member" | "officer" | "admin" | "superadmin";
  joinedDate: string;
  school_id: string;
  year_level: string;
  department: string;
  address: string;
  birthday: string;
  bio?: string | null;
  expertise?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (formValues: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: {
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    year_level?: string | null;
    department?: string | null;
    address?: string | null;
    birthday?: string | null;
    bio?: string | null;
    expertise?: string | null;
  }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let cachedCsrfToken: string | null = null;

async function getCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch("/api/csrf-cookie");
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrf_token;
      return cachedCsrfToken;
    }
  } catch (e) {
    console.error("Failed to fetch CSRF token", e);
  }
  return null;
}

export async function apiRequest(url: string, options: RequestInit = {}) {
  const csrf = await getCsrfToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (csrf && ["POST", "PUT", "DELETE", "PATCH"].includes(options.method || "GET")) {
    headers.set("X-CSRF-TOKEN", csrf);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  if (response.status === 419) {
    cachedCsrfToken = null;
    const retryCsrf = await getCsrfToken();
    if (retryCsrf) {
      headers.set("X-CSRF-TOKEN", retryCsrf);
      return fetch(url, {
        ...options,
        headers,
        credentials: "same-origin",
      });
    }
  }

  return response;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await apiRequest("/api/user");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("Session check error", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    // Clear cached CSRF token to get a fresh one for login
    cachedCsrfToken = null;
    const response = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Invalid credentials.");
    }

    const data = await response.json();
    setUser(data.user);
  };

  const register = async (formValues: any) => {
    cachedCsrfToken = null;
    const response = await apiRequest("/api/register", {
      method: "POST",
      body: JSON.stringify(formValues),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Registration failed. Check your inputs.");
    }

    const data = await response.json();
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiRequest("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request error", e);
    } finally {
      setUser(null);
      cachedCsrfToken = null;
    }
  };

  const updateProfile = async (profileData: any) => {
    const response = await apiRequest("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to update profile.");
    }

    const data = await response.json();
    setUser(data.user);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    const response = await apiRequest("/api/user/password", {
      method: "PUT",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || data.error || "Failed to update password.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isAdmin: user?.role === "admin" || user?.role === "superadmin",
        isSuperAdmin: user?.role === "superadmin",
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
