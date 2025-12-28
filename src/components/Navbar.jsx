import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as Icons from "lucide-react";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={s.nav}>
      {/* Removed the inner "container" div constraint. 
         Applied styles directly to nav for full width. 
      */}
      <div style={s.fullWidthContainer}>
        {/* Logo Area */}
        <Link to="/" style={s.logoLink}>
          <div style={s.logoIcon}>⚡</div>
          <span style={s.logoText}>ApiMonitor</span>
        </Link>

        {/* Navigation Actions */}
        <div style={s.actions}>
          {!token ? (
            <>
              <Link to="/login" style={s.link}>Log in</Link>
              <Link to="/register">
                <button style={s.primaryBtn}>Sign Up</button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" style={s.linkWithIcon}>
                <Icons.LayoutDashboard size={16} /> 
                <span style={s.hideOnMobile}>Dashboard</span>
              </Link>
              <button style={s.outlineBtn} onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// --- STYLES ---
const s = {
  nav: {
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 50,
    height: "64px",
    display: "flex",
    alignItems: "center",
    width: "100%", // Ensures the nav bar itself is full width
  },
  
  // Updated Container: No max-width, fills 100% of viewport
  fullWidthContainer: {
    width: "100%",
    padding: "30px 32px", // Increased padding for better aesthetics at extremes
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box" // Critical for padding calculation
  },
  
  // Logo Styles
  logoLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "inherit"
  },
  logoIcon: {
    width: "32px",
    height: "32px",
    backgroundColor: "#3b82f6", 
    color: "white",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "1.2rem"
  },
  logoText: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#0f172a", 
    letterSpacing: "-0.025em"
  },

  // Actions Area
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "24px"
  },
  link: {
    textDecoration: "none",
    color: "#64748b",
    fontWeight: "500",
    fontSize: "0.95rem",
    transition: "color 0.2s",
    cursor: "pointer"
  },
  linkWithIcon: {
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: "500",
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "color 0.2s"
  },
  
  // Buttons
  primaryBtn: {
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    padding: "8px 20px",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  outlineBtn: {
    backgroundColor: "transparent",
    color: "#ef4444", 
    border: "1px solid #ef4444",
    padding: "7px 15px",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  
  // Responsive Utility
  // Note: CSS-in-JS media queries are tricky without a library.
  // For a simple MVP, we usually just hide text on very small screens or accept a bit of wrap.
  // Ideally, add this class to your index.css if you need strict mobile hiding:
  // .hide-mobile { display: none; } @media (min-width: 600px) { .hide-mobile { display: block; } }
  hideOnMobile: {
    // Basic text protection
    whiteSpace: "nowrap"
  }
};