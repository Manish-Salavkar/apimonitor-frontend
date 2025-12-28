import api from "./axios";

// ==========================
// 1. API Management Endpoints
// ==========================

export const getApis = async () => {
  const response = await api.get("/apis/");
  return response.data; // Returns { data: [...], message: "..." }
};

export const createApi = async (apiData) => {
  // apiData: { name: string, endpoint: string }
  const response = await api.post("/apis/", apiData);
  return response.data;
};

export const updateApi = async (apiId, updateData) => {
  // updateData: { name?: string, endpoint?: string, enabled?: boolean }
  const response = await api.put(`/apis/${apiId}`, updateData);
  return response.data;
};

export const deleteApi = async (apiId) => {
  const response = await api.delete(`/apis/${apiId}`);
  return response.data;
};


// ==========================
// 2. Tier Management Endpoints
// ==========================

export const getTiers = async () => {
  const response = await api.get("/tiers/");
  return response.data;
};

export const createTier = async (tierData) => {
  // tierData: { name, requests_per_minute, requests_per_hour, requests_per_day }
  const response = await api.post("/tiers/", tierData);
  return response.data;
};

export const updateTier = async (tierId, tierData) => {
  const response = await api.put(`/tiers/${tierId}`, tierData);
  return response.data;
};

export const deleteTier = async (tierId) => {
  const response = await api.delete(`/tiers/${tierId}`);
  return response.data;
};


// ==========================
// 3. API Key Management Endpoints
// ==========================

export const getApiKeys = async () => {
  const response = await api.get("/api-keys/");
  return response.data;
};

export const getAllApiKeys = async () => {
  const response = await api.get("/api-keys/all");
  return response.data;
};

export const generateApiKey = async (keyData) => {
  // keyData: { api_id: integer, tier_id: integer }
  const response = await api.post("/api-keys/", keyData);
  return response.data;
};

export const revokeApiKey = async (keyId) => {
  const response = await api.put(`/api-keys/${keyId}/revoke`);
  return response.data;
};

export const deleteApiKey = async (keyId) => {
  const response = await api.delete(`/api-keys/${keyId}`);
  return response.data;
};


// ==========================
// 4. Initial Data Loader (MVP Helper)
// ==========================

/**
 * Fetches APIs, Tiers, and Keys in parallel.
 * Use this in your Dashboard's useEffect to load everything at once.
 */
export const fetchInitialData = async () => {
  try {
    const [apisRes, tiersRes, keysRes] = await Promise.all([
      api.get("/apis/"),
      api.get("/tiers/"),
      api.get("/api-keys/all"),
    ]);

    return {
      apis: apisRes.data.data,
      tiers: tiersRes.data.data,
      keys: keysRes.data.data,
    };
  } catch (error) {
    console.error("Error loading initial data:", error);
    throw error;
  }
};