import { useEffect, useState } from "react";
import {
  getApis,
  deleteApi
} from "../../api/api.api";

export default function ApiList() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadApis = async () => {
    setLoading(true);
    const data = await getApis();
    setApis(data);
    setLoading(false);
  };

  useEffect(() => {
    loadApis();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this API?")) return;
    await deleteApi(id);
    await loadApis();
  };

  if (loading) return <p>Loading APIs…</p>;

  return (
    <div className="table-card">
      <h3>APIs</h3>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Endpoint</th>
            <th>Method</th>
            <th>Enabled</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {apis.map((api) => (
            <tr key={api.id}>
              <td>{api.id}</td>
              <td>{api.name}</td>
              <td>{api.endpoint}</td>
              <td>{api.method}</td>
              <td>{api.enabled ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => handleDelete(api.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
