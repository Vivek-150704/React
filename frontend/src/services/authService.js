
import { apiRequest } from "./api.js";

const TOKEN_KEY = "mars_access_token";
const USER_KEY = "mars_user";

export const authService = {
  async signIn(email, password) {
    const result = await apiRequest("/api/auth/login", {
      method: "POST",
      body: {
        email: email.trim().toLowerCase(),
        password,
      },
    });

    localStorage.setItem(TOKEN_KEY, result.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));

    return result.user;
  },

  async register(fullName, email, password, requestedRole) {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        requestedRole,
      },
    });
  },

  async requests() {
    return apiRequest("/api/auth/requests", {
      token: this.getToken(),
    });
  },

  async decide(id, decision, assignedRole, reason) {
    return apiRequest(
      `/api/auth/requests/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        token: this.getToken(),
        body: {
          decision,
          assignedRole: assignedRole || null,
          reason: reason || null,
        },
      }
    );
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },

  async refreshUser() {
    const user = await apiRequest("/api/auth/me", {
      token: this.getToken(),
    });

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
