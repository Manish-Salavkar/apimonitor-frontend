import api from "../api/axios";
import { useState } from "react";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState([]);

  const aggregate = async () => {
    await api.post("/admin/analytics/aggregate");
    alert("Aggregated");
  };

  const loadAnalytics = async () => {
    const res = await api.get("/analytics/admin");
    setAnalytics(res.data.data);
  };

  return (
    <>
      <h2>Admin Dashboard</h2>
      <button onClick={aggregate}>Aggregate Analytics</button>
      <button onClick={loadAnalytics}>Load Analytics</button>

      <table>
        <thead>
          <tr>
            <th>API</th>
            <th>Requests</th>
            <th>Errors</th>
            <th>Avg Latency</th>
          </tr>
        </thead>
        <tbody>
          {analytics.map(a => (
            <tr key={a.id}>
              <td>{a.api_id}</td>
              <td>{a.request_count}</td>
              <td>{a.error_count}</td>
              <td>{a.avg_response_time_ms}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
