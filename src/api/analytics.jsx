import api from "./axios";
import { format } from "date-fns";

// ==========================
// 1. Analytics Data Endpoints
// ==========================

/**
 * Fetches analytics data for the currently logged-in user.
 */
export const getMyAnalytics = async () => {
  const response = await api.get("/analytics/me");
  return response.data; 
};

/**
 * Fetches ALL analytics data (Admin only).
 * Use this for the Admin Dashboard.
 */
export const getAdminAnalytics = async () => {
  const response = await api.get("/analytics/admin");
  return response.data; // Returns { data: [AnalyticsOut], message: "..." }
};


// ==========================
// 2. Data Processing Endpoints
// ==========================

/**
 * Triggers the backend to aggregate raw logs into analytics windows.
 * Call this if the dashboard looks stale and you want to force an update.
 */
export const triggerAggregation = async () => {
  const response = await api.post("/admin/analytics/aggregate");
  return response.data;
};


// ==========================
// 3. Chart Data Helper
// ==========================

/**
 * Transforms the raw Swagger response into a format Recharts can use.
 */
export const formatAnalyticsForCharts = (analyticsData) => {
  if (!analyticsData || analyticsData.length === 0) return [];

  // Sort by time
  const sortedData = [...analyticsData].sort((a, b) => 
    new Date(a.window_start) - new Date(b.window_start)
  );

  return sortedData.map((item) => {
    // 1. FORCE UTC INTERPRETATION
    // If the string doesn't end in 'Z', we add it. 
    // This tells JS: "This 02:30 is UTC, not my local time."
    const utcString = item.window_start.endsWith("Z") 
      ? item.window_start 
      : item.window_start + "Z";
      
    const date = new Date(utcString);
    
    return {
      // 2. Convert that UTC time to IST (Kolkata)
      time: date.toLocaleTimeString("en-IN", { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,           
        timeZone: "Asia/Kolkata" 
      }),
      
      timestamp: date.getTime(),
      
      // Metrics
      requests: item.request_count,
      errors: item.error_count,
      latency: item.avg_response_time_ms,
      
      success_rate: item.request_count > 0 
        ? ((item.success_count / item.request_count) * 100).toFixed(1) 
        : 0
    };
  });
};