import { apiRequest } from "./api.js";
import { authService } from "./authService.js";

class ApiFinesService {
  async list(filters = {}) {
    const params =
      new URLSearchParams();

    if (filters.status) {
      params.append(
        "status",
        filters.status
      );
    }

    if (filters.customerId) {
      params.append(
        "customerId",
        filters.customerId
      );
    }

    if (filters.reasons?.length) {
      filters.reasons.forEach((reason) => params.append("reason", reason));
    }

    if (filters.search) {
      params.append(
        "search",
        filters.search
      );
    }

    if (filters.fromDate) {
      params.append(
        "fromDate",
        filters.fromDate
      );
    }

    if (filters.toDate) {
      params.append(
        "toDate",
        filters.toDate
      );
    }

    const query =
      params.toString();

    return apiRequest(
      `/api/fines${
        query
          ? `?${query}`
          : ""
      }`,
      {
        token:
          authService.getToken(),
      }
    );
  }

  async reviews(
    fineId
  ) {
    return apiRequest(
      `/api/fines/${encodeURIComponent(
        fineId
      )}/reviews`,
      {
        token:
          authService.getToken(),
      }
    );
  }

  async review(
    fineId,
    request
  ) {
    return apiRequest(
      `/api/fines/${encodeURIComponent(
        fineId
      )}/reviews`,
      {
        method: "POST",

        token:
          authService.getToken(),

        body: {
          expectedStatus:
            request.expectedStatus,

          decision:
            request.decision,

          comment:
            request.comment,
        },
      }
    );
  }
}

export const finesService =
  new ApiFinesService();