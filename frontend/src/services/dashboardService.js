import { apiRequest } from "./api";
import { authService } from "./authService";

class DashboardService {
  async kpis(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "reasons") params.set(key, value);
    });
    (filters.reasons || []).forEach((reason) => params.append("reason", reason));
    const query = params.toString();
    return apiRequest(`/api/dashboard/kpis${query ? `?${query}` : ""}`, {
      token: authService.getToken(),
    });
  }

  async statusDistribution() {
    return apiRequest("/api/dashboard/status-distribution", {
      token: authService.getToken(),
    });
  }

  async statusAmount() {
    return apiRequest("/api/dashboard/status-amount", {
      token: authService.getToken(),
    });
  }

  async reasons() {
    return apiRequest("/api/dashboard/reasons", {
      token: authService.getToken(),
    });
  }

  async trend() {
    return apiRequest("/api/dashboard/trend", {
      token: authService.getToken(),
    });
  }
}

export const dashboardService = new DashboardService();