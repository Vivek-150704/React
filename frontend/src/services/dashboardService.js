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

  async analytics(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "reasons") params.set(key, value);
    });
    (filters.reasons || []).forEach((reason) => params.append("reason", reason));
    const query = params.toString();
    const suffix = query ? `?${query}` : "";
    const token = authService.getToken();
    const options = { token };
    const [status, reasons, trend] = await Promise.all([
      apiRequest(`/api/dashboard/status-distribution${suffix}`, options),
      apiRequest(`/api/dashboard/reasons${suffix}`, options),
      apiRequest(`/api/dashboard/trend${suffix}`, options),
    ]);
    return { status, reasons, trend };
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