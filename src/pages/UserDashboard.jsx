import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import * as Icons from "lucide-react";

// API Imports
import api from "../api/axios"; // Raw axios instance for the test call
import {
  fetchInitialData, // We'll reuse this but filter client-side or assume backend filters
  generateApiKey,
  deleteApiKey
} from "../api/api";
import { getMyAnalytics, formatAnalyticsForCharts } from "../api/analytics";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "http://localhost:8000";

export default function UserDashboard() {
  const { user, logout } = useAuth();

  // --- UI State ---
  const [activeTab, setActiveTab] = useState("keys");
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Data Store
  const [analytics, setAnalytics] = useState([]);
  const [apis, setApis] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [myKeys, setMyKeys] = useState([]);

  // Forms
  const [keyForm, setKeyForm] = useState({ api_id: "", tier_id: "" });
  
  // Test Console State
  const [testConfig, setTestConfig] = useState({ url: "", method: "GET", key: "", result: null, status: null });

  // --- Initial Load ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch System Data (APIs/Tiers)
      // Note: In a real app, you might have specific endpoints like /public/apis
      const initData = await fetchInitialData();
      
      // 2. Fetch User Specific Data
      // Assuming getMyAnalytics returns data for the logged-in user
      const analyticsRes = await getMyAnalytics(); 
      
      setApis(initData.apis);
      setTiers(initData.tiers);
      
      // Filter keys to only show "mine" (Client-side filter if backend returns all, 
      // or rely on backend to return only user's keys if endpoint allows)
      const userKeys = initData.keys.filter(k => k.user_id === user.id);
      setMyKeys(userKeys);

      setAnalytics(formatAnalyticsForCharts(analyticsRes.data));
    } catch (error) {
      console.error("Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    try {
      await generateApiKey(keyForm);
      setKeyForm({ api_id: "", tier_id: "" });
      setIsGenerateOpen(false);
      loadData();
    } catch (err) {
      alert("Error generating key: " + err.message);
    }
  };

  const handleDeleteKey = async (id) => {
    if (!window.confirm("Delete this API Key?")) return;
    await deleteApiKey(id);
    loadData();
  };

  // --- API TESTER LOGIC ---
  const openTestConsole = (key) => {
      const targetApi = apis.find(a => a.id === key.api_id);
      
      let fullUrl = "";
      if (targetApi) {
        // Check if endpoint already has http/https
        if (targetApi.endpoint.startsWith("http")) {
          fullUrl = targetApi.endpoint;
        } else {
          fullUrl = `${BASE_URL}${targetApi.endpoint}`;
        }
      }

      setTestConfig({
        url: fullUrl,
        method: targetApi ? targetApi.method : "GET",
        key: key.key_value,
        result: null,
        status: null,
        isLoading: false
      });
      setIsTestModalOpen(true);
    };

const executeTestCall = async () => {
    setTestConfig(prev => ({ ...prev, isLoading: true, result: null, status: null }));
    try {
      // Use native 'fetch' to avoid dashboard interceptors/JWTs interfering with the API Key
      const res = await fetch(testConfig.url, {
        method: testConfig.method,
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": testConfig.key // Explicitly set the header here
        }
      });

      // Try to parse JSON, fallback to text if fails
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      
      setTestConfig(prev => ({
        ...prev,
        isLoading: false,
        status: res.status,
        result: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
      }));
    } catch (err) {
      setTestConfig(prev => ({
        ...prev,
        isLoading: false,
        status: "Error",
        result: `Network Error: ${err.message}`
      }));
    }
  };

  // --- RENDER HELPERS ---
  if (loading) return <div style={s.centerScreen}>Loading Dashboard...</div>;

  return (
    <div style={s.layout}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.logoIcon}>⚡</div>
          <span style={s.brandText}>ApiMonitor</span>
        </div>

        <div style={s.userProfile}>
          <div style={s.avatar}>{user?.username?.[0].toUpperCase()}</div>
          <div style={s.userDetails}>
            <div style={s.userName}>{user?.username}</div>
            <div style={s.userRole}>Developer</div>
          </div>
        </div>
        
        <nav style={s.nav}>
          <NavBtn label="My API Keys" icon={<Icons.Key size={18}/>} active={activeTab === 'keys'} onClick={() => setActiveTab('keys')} />
          <NavBtn label="Usage Analytics" icon={<Icons.BarChart2 size={18}/>} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavBtn label="API Catalog" icon={<Icons.BookOpen size={18}/>} active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} />
        </nav>

        <button onClick={logout} style={s.logoutBtn}>
          <Icons.LogOut size={16} /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={s.main}>
        <header style={s.header}>
          <h1 style={s.pageTitle}>
            {activeTab === 'keys' && "My API Keys"}
            {activeTab === 'analytics' && "Usage Analytics"}
            {activeTab === 'catalog' && "API Catalog"}
          </h1>
          <button style={s.refreshBtn} onClick={loadData}><Icons.RefreshCw size={14}/> Refresh</button>
        </header>

        <div style={s.content}>

          {/* TAB 1: MY KEYS */}
          {activeTab === 'keys' && (
            <>
              <div style={s.toolbar}>
                <button style={s.primaryBtn} onClick={() => setIsGenerateOpen(true)}>+ Generate New Key</button>
              </div>

              {myKeys.length === 0 ? (
                <div style={s.emptyState}>
                  <Icons.Key size={48} color="#cbd5e1" />
                  <h3>No API Keys Found</h3>
                  <p>Generate a key to start using our services.</p>
                </div>
              ) : (
                <div style={s.grid}>
                  {myKeys.map(key => {
                    const apiName = apis.find(a => a.id === key.api_id)?.name || "Unknown Service";
                    const tierName = tiers.find(t => t.id === key.tier_id)?.name || "Unknown Tier";
                    
                    return (
                      <div key={key.id} style={s.keyCard}>
                        <div style={s.keyHeader}>
                          <span style={s.badgeBlue}>{tierName}</span>
                          <span style={key.enabled ? s.badgeGreen : s.badgeRed}>{key.enabled ? "Active" : "Revoked"}</span>
                        </div>
                        <h3 style={s.keyTitle}>{apiName}</h3>
                        <div style={s.codeBlock}>
                          <code>{key.key_value}</code>
                        </div>
                        <div style={s.keyActions}>
                          <button style={s.testBtn} onClick={() => openTestConsole(key)}>
                            <Icons.Play size={14} /> Test Endpoint
                          </button>
                          <button style={s.iconBtnDestructive} onClick={() => handleDeleteKey(key.id)}>
                            <Icons.Trash size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* GENERATE MODAL */}
              {isGenerateOpen && (
                <div style={s.modalOverlay}>
                  <div style={s.modal}>
                    <h3>Generate New API Key</h3>
                    <form onSubmit={handleGenerateKey} style={s.formStack}>
                      <label style={s.label}>Select Service</label>
                      <select style={s.select} value={keyForm.api_id} onChange={e => setKeyForm({...keyForm, api_id: e.target.value})} required>
                        <option value="">-- Choose API --</option>
                        {apis.filter(a => a.enabled).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>

                      <label style={s.label}>Select Plan (Tier)</label>
                      <select style={s.select} value={keyForm.tier_id} onChange={e => setKeyForm({...keyForm, tier_id: e.target.value})} required>
                        <option value="">-- Choose Tier --</option>
                        {tiers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.requests_per_minute} RPM)</option>)}
                      </select>

                      <div style={s.modalActions}>
                        <button type="button" onClick={() => setIsGenerateOpen(false)} style={s.secondaryBtn}>Cancel</button>
                        <button type="submit" style={s.primaryBtn}>Generate</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TEST CONSOLE MODAL */}
              {isTestModalOpen && (
                <div style={s.modalOverlay}>
                  <div style={s.modalWide}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                      <h3>API Test Console</h3>
                      <button onClick={() => setIsTestModalOpen(false)} style={s.iconBtn}><Icons.X size={20}/></button>
                    </div>
                    
                    <div style={s.consoleBox}>
                      <div style={s.consoleRow}>
                        <span style={s.methodBadge}>{testConfig.method}</span>
                        <input style={s.consoleInput} value={testConfig.url} readOnly />
                        <button 
                          onClick={executeTestCall} 
                          disabled={testConfig.isLoading}
                          style={testConfig.isLoading ? s.runBtnDisabled : s.runBtn}
                        >
                          {testConfig.isLoading ? "Running..." : "Send Request"}
                        </button>
                      </div>
                      
                      <div style={{marginTop: 10, fontSize: 12, color: '#64748b'}}>
                        Authorized with Key: <code>{testConfig.key.substring(0, 15)}...</code>
                      </div>

                      <div style={s.responseArea}>
                        <div style={s.responseHeader}>
                          <span>Response Body</span>
                          {testConfig.status && (
                            <span style={{
                              color: testConfig.status >= 200 && testConfig.status < 300 ? '#10b981' : '#ef4444', 
                              fontWeight: 'bold'
                            }}>
                              Status: {testConfig.status}
                            </span>
                          )}
                        </div>
                        <pre style={s.jsonPre}>
                          {testConfig.result || "// Click 'Send Request' to see output..."}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div style={s.cardLarge}>
              <h3 style={s.cardHeader}>My Traffic Overview</h3>
              {analytics.length > 0 ? (
                <div style={{ height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={analytics}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                      <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10}/>
                      <Tooltip contentStyle={s.tooltip}/>
                      <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r:6}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{padding: 40, textAlign: 'center', color: '#94a3b8'}}>No traffic data available yet.</div>
              )}
            </div>
          )}

          {/* TAB 3: CATALOG */}
          {activeTab === 'catalog' && (
            <div style={s.tableCard}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thRow}>
                    <th style={s.th}>Service Name</th>
                    <th style={s.th}>Method</th>
                    <th style={s.th}>Endpoint</th>
                    <th style={s.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apis.map(api => (
                    <tr key={api.id} style={s.tr}>
                      <td style={s.td}><strong>{api.name}</strong></td>
                      <td style={s.td}><span style={s.badgeGray}>{api.method}</span></td>
                      <td style={s.td}><code style={s.code}>{api.endpoint}</code></td>
                      <td style={s.td}>
                        <span style={api.enabled ? s.badgeGreen : s.badgeRed}>
                          {api.enabled ? "Online" : "Maintenance"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Helper Component for Navigation
const NavBtn = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} style={active ? s.navBtnActive : s.navBtn}>
    {icon} <span style={{marginLeft: 10}}>{label}</span>
  </button>
);

// --- CSS-in-JS STYLES (Matching Admin Theme) ---
const s = {
  layout: { display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "#f8fafc", color: "#0f172a" },
  centerScreen: { height: "100vh", display: "flex", flexDirection: 'column', alignItems: "center", justifyContent: "center", color: "#64748b" },
  
  // Sidebar
  sidebar: { width: 260, background: "#1e293b", color: "#fff", display: "flex", flexDirection: "column", padding: 24 },
  brand: { display: "flex", alignItems: "center", gap: 12, marginBottom: 40 },
  logoIcon: { width: 32, height: 32, background: "#3b82f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  brandText: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.5px" },
  userProfile: { display: "flex", alignItems: "center", gap: 12, paddingBottom: 24, borderBottom: "1px solid #334155", marginBottom: 24 },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  userDetails: { display: "flex", flexDirection: "column" },
  userName: { fontSize: 14, fontWeight: 500 },
  userRole: { fontSize: 11, color: "#94a3b8" },
  nav: { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  navBtn: { display: "flex", alignItems: "center", padding: "10px 12px", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", borderRadius: 6, fontSize: 14, transition: "0.2s" },
  navBtnActive: { display: "flex", alignItems: "center", padding: "10px 12px", background: "#3b82f6", border: "none", color: "#fff", cursor: "pointer", borderRadius: 6, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 6px -1px rgba(59,130,246,0.5)" },
  logoutBtn: { marginTop: "auto", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: "10px", borderRadius: 6, cursor: "pointer" },

  // Main
  main: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" },
  header: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 },
  pageTitle: { fontSize: 24, fontWeight: 700 },
  refreshBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 6, cursor: "pointer", color: "#475569" },
  content: { padding: 40, maxWidth: 1200, margin: "0 auto", width: "100%" },

  // Key Cards Grid
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 },
  keyCard: { background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: 'flex', flexDirection: 'column', gap: 12 },
  keyHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  keyTitle: { fontSize: 16, fontWeight: 600, margin: 0 },
  codeBlock: { background: "#f1f5f9", padding: "10px", borderRadius: 6, fontFamily: "monospace", fontSize: 12, color: "#334155", wordBreak: "break-all" },
  keyActions: { display: 'flex', justifyContent: 'space-between', marginTop: 8 },
  
  // Buttons & Badges
  primaryBtn: { background: "#0f172a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  secondaryBtn: { background: "#fff", color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  testBtn: { background: "#e0f2fe", color: "#0284c7", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  iconBtn: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 4 },
  iconBtnDestructive: { background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 },
  badgeGreen: { background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  badgeRed: { background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  badgeGray: { background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 },
  badgeBlue: { background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  
  // Test Console
  consoleBox: { background: "#1e293b", padding: 20, borderRadius: 8 },
  consoleRow: { display: 'flex', gap: 10, alignItems: 'center' },
  methodBadge: { background: "#3b82f6", color: 'white', padding: "8px 12px", borderRadius: 6, fontWeight: 'bold', fontSize: 13 },
  consoleInput: { flex: 1, background: "#0f172a", border: "1px solid #334155", color: "#fff", padding: "10px", borderRadius: 6, outline: 'none', fontFamily: 'monospace' },
  runBtn: { background: "#10b981", color: "white", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
  runBtnDisabled: { background: "#64748b", color: "white", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "not-allowed" },
  responseArea: { marginTop: 20, background: "#0f172a", borderRadius: 8, overflow: 'hidden' },
  responseHeader: { background: "#334155", padding: "8px 16px", color: "#cbd5e1", fontSize: 12, display: 'flex', justifyContent: 'space-between' },
  jsonPre: { padding: 16, margin: 0, color: "#10b981", fontSize: 13, overflowX: 'auto' },

  // General Tables & Forms
  toolbar: { marginBottom: 20, display: "flex", justifyContent: "flex-end" },
  cardLarge: { background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  cardHeader: { marginBottom: 20, fontSize: 16, fontWeight: 600 },
  tableCard: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  table: { width: "100%", borderCollapse: "collapse" },
  thRow: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "12px 20px", textAlign: "left", fontSize: 13, color: "#64748b", fontWeight: 600 },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "14px 20px", fontSize: 14 },
  code: { background: "#f1f5f9", padding: "4px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12, color: "#334155" },
  emptyState: { textAlign: 'center', padding: 40, color: '#94a3b8' },

  // Modal
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: { background: "#fff", padding: 32, borderRadius: 12, width: 400, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  modalWide: { background: "#fff", padding: 32, borderRadius: 12, width: 600, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  formStack: { display: "flex", flexDirection: "column", gap: 16, marginTop: 20 },
  label: { fontSize: 13, fontWeight: 600, color: "#334155" },
  select: { padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14, background: "#fff", width: '100%' },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 },
  tooltip: { borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }
};