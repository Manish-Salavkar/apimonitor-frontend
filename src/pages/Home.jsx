import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import * as Icons from "lucide-react";

export default function Home() {
  const { token } = useAuth();

  return (
    <div style={s.pageWrapper}>
      {/* Assuming Navbar handles its own layout, but usually it sits at the top */}
      <Navbar /> 

      <main style={s.container}>
        
        {/* HERO SECTION */}
        <div style={s.heroSection}>
          <div style={s.badge}>
            <span style={s.badgeDot}></span> System Operational
          </div>
          <h1 style={s.title}>
            Monitor your API Infrastructure <br />
            <span style={s.titleHighlight}>in Real-Time</span>
          </h1>
          <p style={s.subtitle}>
            A comprehensive solution for health checks, rate limiting, and 
            traffic analytics. Secure your endpoints and optimize performance 
            with role-based management.
          </p>

          <div style={s.ctaGroup}>
            {!token ? (
              <>
                <Link to="/login">
                  <button style={s.primaryBtn}>
                    Get Started <Icons.ArrowRight size={16} />
                  </button>
                </Link>
                <Link to="/register">
                  <button style={s.secondaryBtn}>Create Account</button>
                </Link>
              </>
            ) : (
              <Link to="/dashboard">
                <button style={s.primaryBtn}>
                  Go to Dashboard <Icons.LayoutDashboard size={16} />
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* FEATURES GRID (Visual filler for presentation) */}
        <div style={s.featuresGrid}>
          <FeatureCard 
            icon={<Icons.Activity color="#3b82f6" />} 
            title="Live Analytics" 
            desc="Track requests, latency, and error rates in real-time with interactive charts."
          />
          <FeatureCard 
            icon={<Icons.Shield color="#10b981" />} 
            title="Rate Limiting" 
            desc="Prevent abuse with tiered access controls (RPM/RPH/RPD) and key management."
          />
          <FeatureCard 
            icon={<Icons.Lock color="#f59e0b" />} 
            title="Secure Access" 
            desc="Role-based authentication (RBAC) ensures only authorized personnel can manage APIs."
          />
        </div>

      </main>
    </div>
  );
}

// Helper Component for Features
const FeatureCard = ({ icon, title, desc }) => (
  <div style={s.card}>
    <div style={s.iconWrapper}>{icon}</div>
    <h3 style={s.cardTitle}>{title}</h3>
    <p style={s.cardDesc}>{desc}</p>
  </div>
);

// --- STYLES (SaaS Theme) ---
const s = {
  pageWrapper: {
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#f8fafc", // Slate-50
    color: "#0f172a", // Slate-900
    display: "flex",
    flexDirection: "column"
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "60px 20px",
    textAlign: "center",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  
  // Hero Styles
  heroSection: {
    marginBottom: "80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#dcfce7", // Green-100
    color: "#166534", // Green-800
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
    marginBottom: "24px"
  },
  badgeDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#166534",
    borderRadius: "50%"
  },
  title: {
    fontSize: "3.5rem",
    fontWeight: "800",
    lineHeight: "1.2",
    marginBottom: "24px",
    letterSpacing: "-0.02em"
  },
  titleHighlight: {
    color: "#3b82f6" // Blue-500
  },
  subtitle: {
    fontSize: "1.125rem",
    color: "#64748b", // Slate-500
    maxWidth: "600px",
    lineHeight: "1.6",
    marginBottom: "40px"
  },
  
  // Buttons
  ctaGroup: {
    display: "flex",
    gap: "16px",
    justifyContent: "center"
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#0f172a", // Slate-900
    color: "white",
    padding: "14px 28px",
    fontSize: "1rem",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.1s ease",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  secondaryBtn: {
    backgroundColor: "white",
    color: "#0f172a",
    padding: "14px 28px",
    fontSize: "1rem",
    fontWeight: "600",
    border: "1px solid #cbd5e1", // Slate-300
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.2s"
  },

  // Feature Grid
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    width: "100%",
    textAlign: "left"
  },
  card: {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  iconWrapper: {
    marginBottom: "20px",
    padding: "12px",
    backgroundColor: "#f1f5f9",
    borderRadius: "12px",
    display: "inline-block"
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#1e293b"
  },
  cardDesc: {
    color: "#64748b",
    lineHeight: "1.5",
    fontSize: "0.95rem"
  }
};