import React, { useEffect, useState, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, AreaChart, Area, ComposedChart
} from "recharts";
import * as Icons from "lucide-react";

// API Imports
import {
  fetchInitialData,
  createApi, updateApi, deleteApi,
  createTier, updateTier, deleteTier,
  generateApiKey, revokeApiKey, deleteApiKey
} from "../api/api";

import { 
  getAdminAnalytics, 
  getUserUsageAnalytics, // <--- NEW IMPORT
  triggerAggregation, 
  formatAnalyticsForCharts 
} from "../api/analytics";

import { useAuth } from "../context/AuthContext";

const BASE_URL = "http://localhost:8000"; 

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // --- UI State ---
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [modalMode, setModalMode] = useState("create"); 
  
  // Stress Test UI State
  const [isStressConfigOpen, setIsStressConfigOpen] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [stressLogs, setStressLogs] = useState([]);
  const [stressChartData, setStressChartData] = useState([]); 
  const [stressTargetApi, setStressTargetApi] = useState(null);
  
  // KPI Stats
  const [stressStats, setStressStats] = useState({
    total_requests: 0, current_rps: 0, avg_latency: 0, max_latency: 0, fail_rate: 0
  });
  
  const stressSectionRef = useRef(null);
  const terminalEndRef = useRef(null);

  // --- Filters State ---
  const [keySearch, setKeySearch] = useState("");
  const [keyStatusFilter, setKeyStatusFilter] = useState("ALL"); 
  
  // --- Time Range Filter State ---
  const [timeRange, setTimeRange] = useState("24h"); 
  const [rawAnalytics, setRawAnalytics] = useState([]); 

  // --- Data Store ---
  const [analytics, setAnalytics] = useState([]); 
  const [apis, setApis] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [keys, setKeys] = useState([]);
  
  // --- NEW: User Usage Data Store ---
  const [userUsageStats, setUserUsageStats] = useState({ api_summary: [], user_activity: [] });

  // --- Forms State ---
  const [apiForm, setApiForm] = useState({ id: null, name: "", endpoint: "", method: "GET", enabled: true });
  const [tierForm, setTierForm] = useState({ 
    id: null, name: "", description: "", 
    requests_per_minute: 60, requests_per_hour: 1000, requests_per_day: 10000 
  });
  const [keyForm, setKeyForm] = useState({ api_id: "", tier_id: "" });
  
  const [stressForm, setStressForm] = useState({
    num_users: 10, spawn_rate: 2, duration: 10, api_key: ""
  });

  // --- Initial Load ---
  useEffect(() => { loadAllData(); }, []);

  // --- Filter Effect ---
  useEffect(() => {
    if (rawAnalytics.length === 0) return;
    const now = new Date();
    let cutoff = new Date();
    switch(timeRange) {
      case "1h": cutoff.setHours(now.getHours() - 1); break;
      case "24h": cutoff.setHours(now.getHours() - 24); break;
      case "7d": cutoff.setDate(now.getDate() - 7); break;
      case "30d": cutoff.setDate(now.getDate() - 30); break;
      case "all": cutoff = new Date(0); break; 
      default: cutoff.setHours(now.getHours() - 24);
    }
    const filteredRaw = rawAnalytics.filter(item => {
      const itemDate = new Date(item.window_start); 
      return itemDate >= cutoff;
    });
    setAnalytics(formatAnalyticsForCharts(filteredRaw));
  }, [timeRange, rawAnalytics]);


  const loadAllData = async () => {
    try {
      setLoading(true);
      // Fetch everything including the new User Usage endpoint
      const [initData, analyticsRes, userUsageRes] = await Promise.all([
        fetchInitialData(), 
        getAdminAnalytics(),
        getUserUsageAnalytics() // <--- Fetch new data
      ]);
      
      setApis(initData.apis); 
      setTiers(initData.tiers); 
      setKeys(initData.keys);
      setRawAnalytics(analyticsRes.data);
      setUserUsageStats(userUsageRes); // <--- Store new data

    } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
  };

  // ... (Auto-scroll logic) ...
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [stressLogs]);
  useEffect(() => {
    if (isTestRunning && stressSectionRef.current) {
      stressSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isTestRunning]);

  const handleAggregation = async () => {
    try { setIsProcessing(true); await triggerAggregation(); await loadAllData(); } 
    catch (error) { alert("Failed: " + error.message); } finally { setIsProcessing(false); }
  };

  // ... (Stress Test Logic unchanged) ...
  const openStressModal = (api) => { setStressTargetApi(api); const validKey = keys.find(k => k.api_id === api.id && k.enabled)?.key_value || ""; setStressForm({ num_users: 10, spawn_rate: 2, duration: 15, api_key: validKey }); setIsStressConfigOpen(true); };
  const runStressTest = async (e) => {
    e.preventDefault();
    if (!stressForm.api_key) return alert("API Key required");
    setIsStressConfigOpen(false); setIsTestRunning(true);
    setStressLogs(["Initializing Locust Swarm..."]); setStressChartData([]); setStressStats({ total_requests: 0, current_rps: 0, avg_latency: 0, max_latency: 0, fail_rate: 0 });
    try {
      const response = await fetch(`${BASE_URL}/stress/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_host: BASE_URL, target_endpoint: stressTargetApi.endpoint, api_key: stressForm.api_key, num_users: parseInt(stressForm.num_users), spawn_rate: parseInt(stressForm.spawn_rate), duration: parseInt(stressForm.duration) })
      });
      const reader = response.body.getReader(); const decoder = new TextDecoder("utf-8");
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        const chunk = decoder.decode(value); const lines = chunk.split("\n").filter(line => line.trim() !== "");
        lines.forEach(line => {
          try {
            const data = JSON.parse(line);
            if (data.log) {
              setStressLogs(prev => [...prev, data.log]);
              if (data.log.startsWith("Aggregated")) {
                const parts = data.log.split("|");
                if (parts.length === 3) {
                  const reqPart = parts[0].trim().split(/\s+/); const totalReqs = parseInt(reqPart[1]); const failStr = reqPart[2]; const failRate = parseFloat(failStr.split("(")[1].replace("%)", ""));
                  const latencyPart = parts[1].trim().split(/\s+/); const avgLat = parseFloat(latencyPart[0]); const maxLat = parseFloat(latencyPart[2]);
                  const ratePart = parts[2].trim().split(/\s+/); const rps = parseFloat(ratePart[0]);
                  const newDataPoint = { time: new Date().toLocaleTimeString(), rps: rps, failures: parseFloat(ratePart[1]), avg_latency: avgLat };
                  if (!isNaN(rps)) { setStressChartData(prev => [...prev, newDataPoint]); setStressStats({ total_requests: totalReqs, current_rps: rps, avg_latency: avgLat, max_latency: maxLat, fail_rate: failRate }); }
                }
              }
            }
            if (data.status === "completed") { setStressLogs(prev => [...prev, ">>> TEST COMPLETED <<<"]); setIsTestRunning(false); }
          } catch (err) { /* ignore */ }
        });
      }
    } catch (error) { setStressLogs(prev => [...prev, `ERROR: ${error.message}`]); setIsTestRunning(false); }
  };

  // ... (Helpers & CRUD unchanged) ...
  const getFilteredKeys = () => { return keys.filter(k => { if (keyStatusFilter === "ACTIVE" && !k.enabled) return false; if (keyStatusFilter === "REVOKED" && k.enabled) return false; if (keySearch) { const apiName = apis.find(a => a.id === k.api_id)?.name || ""; const searchLower = keySearch.toLowerCase(); return k.key_value.toLowerCase().includes(searchLower) || apiName.toLowerCase().includes(searchLower); } return true; }); };
  const openApiModal = (api = null) => { if (api) { setApiForm({ ...api }); setModalMode("edit"); } else { setApiForm({ name: "", endpoint: "", method: "GET", enabled: true }); setModalMode("create"); } setIsModalOpen(true); };
  const submitApi = async (e) => { e.preventDefault(); modalMode === "create" ? await createApi(apiForm) : await updateApi(apiForm.id, apiForm); setIsModalOpen(false); loadAllData(); };
  const removeApi = async (id) => { if (window.confirm("Delete?")) await deleteApi(id); loadAllData(); };
  const openTierModal = (tier = null) => { if (tier) { setTierForm({ ...tier }); setModalMode("edit"); } else { setTierForm({ name: "", description: "", requests_per_minute: 60, requests_per_hour: 1000, requests_per_day: 10000 }); setModalMode("create"); } setIsModalOpen(true); };
  const submitTier = async (e) => { e.preventDefault(); modalMode === "create" ? await createTier(tierForm) : await updateTier(tierForm.id, tierForm); setIsModalOpen(false); loadAllData(); };
  const removeTier = async (id) => { if (window.confirm("Delete?")) await deleteTier(id); loadAllData(); };
  const submitKey = async (e) => { e.preventDefault(); await generateApiKey(keyForm); setKeyForm({ api_id: "", tier_id: "" }); loadAllData(); };
  const revokeKey = async (id) => { if (window.confirm("Revoke?")) await revokeApiKey(id); loadAllData(); };
  const removeKey = async (id) => { if (window.confirm("Delete?")) await deleteApiKey(id); loadAllData(); };

  if (loading && !rawAnalytics.length && !apis.length) return <div style={s.centerScreen}>Loading Dashboard...</div>;

  return (
    <div style={s.layout}>
      <aside style={s.sidebar}>
        <div style={s.brand}><div style={s.logoIcon}>⚡</div><span style={s.brandText}>ApiMonitor</span></div>
        <div style={s.userProfile}>
          <div style={s.avatar}>{user?.username?.[0].toUpperCase()}</div>
          <div style={s.userDetails}><div style={s.userName}>{user?.username}</div><div style={s.userRole}>Administrator</div></div>
        </div>
        <nav style={s.nav}>
          <NavBtn label="Analytics" icon={<Icons.BarChart2 size={18}/>} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          {/* NEW: USER USAGE TAB BUTTON */}
          <NavBtn label="User Usage" icon={<Icons.Users size={18}/>} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          
          <NavBtn label="API Services" icon={<Icons.Server size={18}/>} active={activeTab === 'apis'} onClick={() => setActiveTab('apis')} />
          <NavBtn label="Tiers & Limits" icon={<Icons.Layers size={18}/>} active={activeTab === 'tiers'} onClick={() => setActiveTab('tiers')} />
          <NavBtn label="Access Keys" icon={<Icons.Key size={18}/>} active={activeTab === 'keys'} onClick={() => setActiveTab('keys')} />
        </nav>
        <button onClick={logout} style={s.logoutBtn}><Icons.LogOut size={16} /> Logout</button>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <h1 style={s.pageTitle}>
            {activeTab === 'overview' && "System Overview"}
            {activeTab === 'users' && "User Activity & Usage"}
            {activeTab === 'apis' && "API Registry"}
            {activeTab === 'tiers' && "Monetization Tiers"}
            {activeTab === 'keys' && "API Keys"}
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
             {activeTab === 'overview' && (
               <select style={s.headerSelect} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                 <option value="1h">Last 1 Hour</option><option value="24h">Last 24 Hours</option><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="all">All Time</option>
               </select>
             )}
             {(activeTab === 'overview' || activeTab === 'users') && (
               <button style={isProcessing ? s.processingBtn : s.secondaryBtn} onClick={handleAggregation} disabled={isProcessing}>
                 {isProcessing ? "Processing..." : "⚡ Update Data"}
               </button>
             )}
             <button style={s.refreshBtn} onClick={loadAllData}><Icons.RefreshCw size={14} className={loading ? "spin" : ""}/> Refresh</button>
          </div>
        </header>

        <div style={s.content}>
          
          {/* 1. ANALYTICS */}
          {activeTab === 'overview' && (
            <div style={s.grid}>
              <div style={s.cardLarge}>
                <h3 style={s.cardHeader}>Global Traffic Volume ({timeRange})</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer><LineChart data={analytics}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10}/><YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10}/><Tooltip contentStyle={s.tooltip}/><Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer>
                </div>
              </div>
              <div style={s.cardLarge}>
                <h3 style={s.cardHeader}>Latency & Errors ({timeRange})</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer><BarChart data={analytics}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/><YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/><Tooltip contentStyle={s.tooltip}/><Legend /><Bar dataKey="latency" name="Latency (ms)" fill="#94a3b8" radius={[4,4,0,0]} barSize={20}/><Bar dataKey="errors" name="Errors" fill="#ef4444" radius={[4,4,0,0]} barSize={20}/></BarChart></ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 2. NEW: USER USAGE ANALYTICS */}
          {activeTab === 'users' && (
            <>
              {/* TOP ROW: CHARTS */}
              <div style={s.grid}>
                <div style={s.cardLarge}>
                  <h3 style={s.cardHeader}>API Popularity (Total Calls)</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={userUsageStats.api_summary} layout="vertical" margin={{left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0"/>
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis dataKey="api_name" type="category" width={100} stroke="#64748b" fontSize={12} />
                        <Tooltip contentStyle={s.tooltip}/>
                        <Bar dataKey="total_calls" name="Total Calls" fill="#3b82f6" radius={[0,4,4,0]} barSize={20}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={s.cardLarge}>
                  <h3 style={s.cardHeader}>User Reach (Unique Users)</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={userUsageStats.api_summary}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                        <XAxis dataKey="api_name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={s.tooltip}/>
                        <Bar dataKey="unique_users" name="Unique Users" fill="#10b981" radius={[4,4,0,0]} barSize={30}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: USER ACTIVITY TABLE */}
              <div style={{...s.tableCard, marginTop: 24}}>
                <div style={{padding: "20px 24px", borderBottom: "1px solid #e2e8f0"}}>
                  <h3 style={{fontSize: 16, fontWeight: 600, margin: 0}}>User Activity Ledger</h3>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr style={s.thRow}>
                      <th style={s.th}>User</th>
                      <th style={s.th}>API Service</th>
                      <th style={s.th}>Total Calls</th>
                      <th style={s.th}>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userUsageStats.user_activity.map((row, idx) => (
                      <tr key={idx} style={s.tr}>
                        <td style={s.td}>
                          <div style={{display:'flex', alignItems:'center', gap: 10}}>
                            <div style={{width: 24, height: 24, borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 11, fontWeight:'bold', color:'#64748b'}}>
                              {row.username[0].toUpperCase()}
                            </div>
                            <strong>{row.username}</strong>
                          </div>
                        </td>
                        <td style={s.td}><span style={s.badgeBlue}>{row.api_name}</span></td>
                        <td style={s.td}>{row.total_calls.toLocaleString()}</td>
                        <td style={s.td}><span style={s.badgeGray}>{new Date(row.last_called).toLocaleString()}</span></td>
                      </tr>
                    ))}
                    {userUsageStats.user_activity.length === 0 && (
                      <tr><td colSpan="4" style={{padding: 40, textAlign: 'center', color: '#94a3b8'}}>No user activity recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ... (Rest of Tabs: apis, tiers, keys - UNCHANGED) ... */}
          {activeTab === 'apis' && (<><div style={s.toolbar}><button style={s.primaryBtn} onClick={() => openApiModal()}>+ Register Service</button></div><div style={s.tableCard}><table style={s.table}><thead><tr style={s.thRow}><th style={s.th}>ID</th><th style={s.th}>Service Name</th><th style={s.th}>Endpoint</th><th style={s.th}>Status</th><th style={s.thRight}>Actions</th></tr></thead><tbody>{apis.map(api => (<tr key={api.id} style={s.tr}><td style={s.td}>{api.id}</td><td style={s.td}><strong>{api.name}</strong></td><td style={s.td}><code style={s.code}>{api.endpoint}</code></td><td style={s.td}><span style={api.enabled ? s.badgeGreen : s.badgeRed}>{api.enabled ? "Active" : "Disabled"}</span></td><td style={s.tdRight}><button style={s.actionBtnBlue} onClick={() => openStressModal(api)}><Icons.Zap size={12} style={{marginRight: 4}}/> Stress Test</button><button style={s.iconBtn} onClick={() => openApiModal(api)}><Icons.Edit2 size={16}/></button><button style={s.iconBtnDestructive} onClick={() => removeApi(api.id)}><Icons.Trash size={16}/></button></td></tr>))}</tbody></table></div>{/* Modals hidden for brevity (same as previous) */}{(stressChartData.length > 0 || isTestRunning) && (<div style={s.stressSection} ref={stressSectionRef}><div style={s.stressHeader}><div style={{display:'flex', alignItems:'center', gap: 10}}><div style={isTestRunning ? s.pulseDot : s.dotGreen}></div><h3 style={{fontSize: 18, color: 'white', margin: 0}}>{isTestRunning ? "🔥 Stress Test In Progress..." : "✅ Stress Test Completed"}</h3></div>{isTestRunning && <span style={{color: '#94a3b8', fontSize: 13}}>Streaming Data...</span>}</div><div style={s.kpiGrid}><KpiCard label="Total Requests" value={stressStats.total_requests} icon={<Icons.Activity size={18} color="#3b82f6"/>} /><KpiCard label="RPS (Current)" value={stressStats.current_rps} icon={<Icons.Zap size={18} color="#eab308"/>} /><KpiCard label="Avg Latency" value={`${stressStats.avg_latency} ms`} icon={<Icons.Clock size={18} color="#a855f7"/>} /><KpiCard label="Max Latency" value={`${stressStats.max_latency} ms`} icon={<Icons.AlertCircle size={18} color="#f97316"/>} /><KpiCard label="Error Rate" value={`${stressStats.fail_rate}%`} icon={<Icons.XCircle size={18} color="#ef4444"/>} isDanger={stressStats.fail_rate > 0} /></div><div style={s.stressGrid}><div style={s.stressCard}><h4 style={s.stressCardTitle}>Requests per Second (RPS)</h4><ResponsiveContainer width="100%" height={200}><AreaChart data={stressChartData}><defs><linearGradient id="colorRps" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="time" hide /><YAxis stroke="#94a3b8" fontSize={10} /><Tooltip contentStyle={{background: '#1e293b', border: 'none', color: '#fff'}} /><Area type="monotone" dataKey="rps" stroke="#10b981" fillOpacity={1} fill="url(#colorRps)" strokeWidth={2} /><Area type="monotone" dataKey="failures" stroke="#ef4444" fill="#ef4444" strokeWidth={2} /></AreaChart></ResponsiveContainer></div><div style={s.stressCard}><h4 style={s.stressCardTitle}>Response Time (ms)</h4><ResponsiveContainer width="100%" height={200}><AreaChart data={stressChartData}><defs><linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="time" hide /><YAxis stroke="#94a3b8" fontSize={10} /><Tooltip contentStyle={{background: '#1e293b', border: 'none', color: '#fff'}} /><Area type="monotone" dataKey="avg_latency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLat)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div><div style={s.terminalBox}><div style={s.terminalTitle}>Execution Logs</div><div style={s.terminalContent}>{stressLogs.map((log, i) => (<div key={i} style={s.logLine}>{log}</div>))}<div ref={terminalEndRef} /></div></div></div>)}{isStressConfigOpen && (<div style={s.modalOverlay}><div style={s.modal}><h3>Stress Test: {stressTargetApi?.name}</h3><form onSubmit={runStressTest} style={s.formStack}><div style={s.gridThreeCol}><div style={s.formGroup}><label style={s.label}>Users</label><input type="number" style={s.input} value={stressForm.num_users} onChange={e => setStressForm({...stressForm, num_users: e.target.value})} /></div><div style={s.formGroup}><label style={s.label}>Spawn Rate</label><input type="number" style={s.input} value={stressForm.spawn_rate} onChange={e => setStressForm({...stressForm, spawn_rate: e.target.value})} /></div><div style={s.formGroup}><label style={s.label}>Duration (s)</label><input type="number" style={s.input} value={stressForm.duration} onChange={e => setStressForm({...stressForm, duration: e.target.value})} /></div></div><div style={s.formGroup}><label style={s.label}>Authorization Key</label><select style={s.select} value={stressForm.api_key} onChange={e => setStressForm({...stressForm, api_key: e.target.value})} required><option value="">-- Select Key --</option>{keys.filter(k => k.api_id === stressTargetApi?.id && k.enabled).map(k => (<option key={k.id} value={k.key_value}>{k.key_value.substring(0, 15)}...</option>))}</select></div><div style={s.modalActions}><button type="button" onClick={() => setIsStressConfigOpen(false)} style={s.secondaryBtn}>Cancel</button><button type="submit" style={s.primaryBtnDanger}>🚀 Launch</button></div></form></div></div>)}{isModalOpen && (<div style={s.modalOverlay}><div style={s.modal}><h3>{modalMode === 'create' ? 'Register API' : 'Edit API'}</h3><form onSubmit={submitApi} style={s.formStack}><label style={s.label}>Service Name</label><input style={s.input} value={apiForm.name} onChange={e => setApiForm({...apiForm, name: e.target.value})} required/><label style={s.label}>Endpoint Base URL</label><input style={s.input} value={apiForm.endpoint} onChange={e => setApiForm({...apiForm, endpoint: e.target.value})} required/><label style={s.checkboxLabel}><input type="checkbox" checked={apiForm.enabled} onChange={e => setApiForm({...apiForm, enabled: e.target.checked})}/> Service Active</label><div style={s.modalActions}><button type="button" onClick={() => setIsModalOpen(false)} style={s.secondaryBtn}>Cancel</button><button type="submit" style={s.primaryBtn}>Save</button></div></form></div></div>)}</>)}

          {activeTab === 'tiers' && (<><div style={s.toolbar}><button style={s.primaryBtn} onClick={() => openTierModal()}>+ New Tier</button></div><div style={s.tableCard}><table style={s.table}><thead><tr style={s.thRow}><th style={s.th}>Name</th><th style={s.th}>Limits</th><th style={s.th}>Desc</th><th style={s.thRight}>Actions</th></tr></thead><tbody>{tiers.map(t => (<tr key={t.id} style={s.tr}><td style={s.td}><strong>{t.name}</strong></td><td style={s.td}>{t.requests_per_minute}/{t.requests_per_hour}/{t.requests_per_day}</td><td style={s.td}>{t.description}</td><td style={s.tdRight}><button style={s.iconBtn} onClick={()=>openTierModal(t)}><Icons.Edit2 size={16}/></button><button style={s.iconBtnDestructive} onClick={()=>removeTier(t.id)}><Icons.Trash size={16}/></button></td></tr>))}</tbody></table></div>{isModalOpen && (<div style={s.modalOverlay}><div style={s.modalWide}><h3>{modalMode} Tier</h3><form onSubmit={submitTier} style={s.formStack}><div style={s.formGroup}><label style={s.label}>Name</label><input style={s.input} value={tierForm.name} onChange={e=>setTierForm({...tierForm, name:e.target.value})}/></div><div style={s.formGroup}><label style={s.label}>Desc</label><input style={s.input} value={tierForm.description} onChange={e=>setTierForm({...tierForm, description:e.target.value})}/></div><div style={s.gridThreeCol}><div style={s.formGroup}><label style={s.label}>RPM</label><input type="number" style={s.input} value={tierForm.requests_per_minute} onChange={e=>setTierForm({...tierForm, requests_per_minute:e.target.value})}/></div><div style={s.formGroup}><label style={s.label}>RPH</label><input type="number" style={s.input} value={tierForm.requests_per_hour} onChange={e=>setTierForm({...tierForm, requests_per_hour:e.target.value})}/></div><div style={s.formGroup}><label style={s.label}>RPD</label><input type="number" style={s.input} value={tierForm.requests_per_day} onChange={e=>setTierForm({...tierForm, requests_per_day:e.target.value})}/></div></div><div style={s.modalActions}><button type="button" onClick={()=>setIsModalOpen(false)} style={s.secondaryBtn}>Cancel</button><button type="submit" style={s.primaryBtn}>Save</button></div></form></div></div>)}</>)}

          {activeTab === 'keys' && (<><div style={s.formCard}><h3 style={s.cardHeader}>Issue New API Key</h3><form onSubmit={submitKey} style={s.inlineForm}><select style={s.select} value={keyForm.api_id} onChange={e => setKeyForm({...keyForm, api_id: e.target.value})} required><option value="">Service...</option>{apis.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select><select style={s.select} value={keyForm.tier_id} onChange={e => setKeyForm({...keyForm, tier_id: e.target.value})} required><option value="">Tier...</option>{tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><button type="submit" style={s.primaryBtn}>Generate Key</button></form></div><div style={s.filterToolbar}><div style={s.filterGroup}><Icons.Search size={16} color="#64748b" /><input style={s.searchInput} placeholder="Search..." value={keySearch} onChange={(e) => setKeySearch(e.target.value)} /></div><select style={s.filterSelect} value={keyStatusFilter} onChange={(e) => setKeyStatusFilter(e.target.value)}><option value="ALL">All Status</option><option value="ACTIVE">Active</option><option value="REVOKED">Revoked</option></select></div><div style={s.tableCard}><table style={s.table}><thead><tr style={s.thRow}><th style={s.th}>Key Value</th><th style={s.th}>User ID</th><th style={s.th}>API</th><th style={s.th}>Tier</th><th style={s.th}>Status</th><th style={s.thRight}>Actions</th></tr></thead><tbody>{getFilteredKeys().map(key => (<tr key={key.id} style={s.tr}><td style={s.td}><code style={s.code}>{key.key_value.substring(0, 20)}...</code></td><td style={s.td}><span style={s.badgeGray}>ID: {key.user_id}</span></td><td style={s.td}>{apis.find(a=>a.id===key.api_id)?.name}</td><td style={s.td}><span style={s.badgeBlue}>{tiers.find(t=>t.id===key.tier_id)?.name}</span></td><td style={s.td}><span style={key.enabled?s.badgeGreen:s.badgeRed}>{key.enabled?"Active":"Revoked"}</span></td><td style={s.tdRight}>{key.enabled && <button onClick={()=>revokeKey(key.id)} style={s.actionBtnWarning}>Revoke</button>}<button onClick={()=>removeKey(key.id)} style={s.actionBtnDanger}>Delete</button></td></tr>))}</tbody></table></div></>)}

        </div>
      </main>
    </div>
  );
}

// Helpers
const NavBtn = ({ label, icon, active, onClick }) => (<button onClick={onClick} style={active ? s.navBtnActive : s.navBtn}>{icon} <span style={{marginLeft: 10}}>{label}</span></button>);

const KpiCard = ({ label, value, icon, isDanger }) => (
  <div style={s.kpiCard}>
    <div style={s.kpiHeader}>
      <span style={{color: '#94a3b8', fontSize: 12, fontWeight: 600}}>{label}</span>
      {icon}
    </div>
    <div style={{fontSize: 24, fontWeight: 700, color: isDanger ? '#ef4444' : '#fff', marginTop: 8}}>{value}</div>
  </div>
);

const s = {
  // ... (Include Previous Layout Styles) ...
  layout: { display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "#f8fafc", color: "#0f172a" },
  centerScreen: { height: "100vh", display: "flex", flexDirection: 'column', alignItems: "center", justifyContent: "center", color: "#64748b" },
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
  main: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" },
  header: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 },
  pageTitle: { fontSize: 24, fontWeight: 700 },
  refreshBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 6, cursor: "pointer", color: "#475569" },
  processingBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "none", background: "#64748b", borderRadius: 6, cursor: "not-allowed", color: "white" },
  secondaryBtn: { background: "#fff", color: "#0f172a", border: "1px solid #cbd5e1", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  content: { padding: 40, maxWidth: 1200, margin: "0 auto", width: "100%" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  cardLarge: { background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  cardHeader: { marginBottom: 20, fontSize: 16, fontWeight: 600 },
  tableCard: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  formCard: { background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 24 },
  table: { width: "100%", borderCollapse: "collapse" },
  thRow: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "12px 20px", textAlign: "left", fontSize: 13, color: "#64748b", fontWeight: 600 },
  thRight: { padding: "12px 20px", textAlign: "right", fontSize: 13, color: "#64748b", fontWeight: 600 },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "14px 20px", fontSize: 14 },
  tdRight: { padding: "14px 20px", textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 8 },
  code: { background: "#f1f5f9", padding: "4px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12, color: "#334155" },
  badgeGreen: { background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  badgeRed: { background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  badgeGray: { background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 },
  badgeBlue: { background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  limitTag: { background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "2px 6px", borderRadius: 4, fontSize: 11, marginRight: 6 },
  primaryBtn: { background: "#0f172a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  primaryBtnDanger: { background: "#ef4444", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 500 },
  iconBtn: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 4 },
  iconBtnDestructive: { background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 },
  actionBtnWarning: { background: "#ffedd5", color: "#9a3412", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500 },
  actionBtnDanger: { background: "#fee2e2", color: "#991b1b", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500 },
  actionBtnBlue: { background: "#e0f2fe", color: "#0369a1", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center' },
  toolbar: { marginBottom: 20, display: "flex", justifyContent: "flex-end" },
  filterToolbar: { display: 'flex', gap: 12, marginBottom: 15 },
  filterGroup: { display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, padding: '0 10px', flex: 1, maxWidth: 300 },
  searchInput: { border: 'none', padding: '10px', fontSize: 14, width: '100%', outline: 'none' },
  filterSelect: { padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, background: "#fff", cursor: 'pointer' },
  inlineForm: { display: "flex", gap: 12, marginTop: 16 },
  input: { padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", width: '100%', boxSizing: 'border-box' },
  select: { padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14, background: "#fff", minWidth: 150, width: '100%' },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: { background: "#fff", padding: 32, borderRadius: 12, width: 400, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  modalWide: { background: "#fff", padding: 32, borderRadius: 12, width: 550, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  formStack: { display: "flex", flexDirection: "column", gap: 16 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  gridThreeCol: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: "#334155" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 },
  checkboxLabel: { display: "flex", gap: 10, alignItems: "center", fontSize: 14 },
  tooltip: { borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },

  // --- NEW STRESS STYLES ---
  stressSection: { marginTop: 40, background: '#0f172a', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #334155' },
  stressHeader: { padding: "20px 24px", background: "#1e293b", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pulseDot: { width: 12, height: 12, background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 10px #ef4444", animation: "pulse 1.5s infinite" },
  dotGreen: { width: 12, height: 12, background: "#10b981", borderRadius: "50%" },
  dotRed: { width: 12, height: 12, background: "#ef4444", borderRadius: "50%" },
  stressGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: 24 },
  stressCard: { background: "#1e293b", padding: 16, borderRadius: 8, border: "1px solid #334155" },
  stressCardTitle: { color: "#94a3b8", fontSize: 13, margin: "0 0 15px 0", textTransform: "uppercase", letterSpacing: "1px" },
  terminalBox: { padding: "0 24px 24px 24px" },
  terminalTitle: { color: "#64748b", fontSize: 12, marginBottom: 10, textTransform: "uppercase" },
  terminalContent: { background: "#020617", borderRadius: 8, padding: 16, height: 200, overflowY: "auto", fontFamily: "monospace", fontSize: 12, color: "#10b981", border: "1px solid #334155", lineHeight: "1.5" },
  logLine: { borderBottom: "1px solid rgba(255,255,255,0.05)" },
  
  // KPI Styles
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, padding: "24px 24px 0 24px" },
  kpiCard: { background: "#1e293b", padding: 20, borderRadius: 8, border: "1px solid #334155", display: 'flex', flexDirection: 'column' },
  kpiHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  
  // NEW: Header Select
  headerSelect: { padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14, background: "#fff", cursor: 'pointer', color: '#475569', fontWeight: 500 }
};

// Add Pulse Animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}`;
document.head.appendChild(styleSheet);