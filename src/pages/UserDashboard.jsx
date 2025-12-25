import api from "../api/axios";
import { useState } from "react";

export default function UserDashboard() {
  const [result, setResult] = useState("");

  const callApi = async () => {
    const apiKey = prompt("Enter API Key");
    const res = await api.get("/internal/ping", {
      headers: { "X-API-KEY": apiKey }
    });
    setResult(JSON.stringify(res.data));
  };

  return (
    <>
      <h2>User Dashboard</h2>
      <button onClick={callApi}>Call API</button>
      <pre>{result}</pre>
    </>
  );
}
