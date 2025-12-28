import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import * as Icons from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // 🔒 Client-side password match check
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        email,
        username,
        password
      });

      // Redirect to login on success
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={s.pageWrapper}>
      <Navbar />

      <div style={s.centerContainer}>
        <div style={s.card}>
          <div style={s.header}>
            <div style={s.logoIcon}>⚡</div>
            <h2 style={s.title}>Create Account</h2>
            <p style={s.subtitle}>Join ApiMonitor to start managing your services.</p>
          </div>

          {error && (
            <div style={s.errorAlert}>
              <Icons.AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>
            {/* Email Input */}
            <div style={s.inputGroup}>
              <label style={s.label}>Email Address</label>
              <div style={s.inputWrapper}>
                <Icons.Mail size={18} style={s.inputIcon} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  style={s.input}
                />
              </div>
            </div>

            {/* Username Input */}
            <div style={s.inputGroup}>
              <label style={s.label}>Username</label>
              <div style={s.inputWrapper}>
                <Icons.User size={18} style={s.inputIcon} />
                <input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  required
                  onChange={(e) => setUsername(e.target.value)}
                  style={s.input}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={s.inputGroup}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrapper}>
                <Icons.Lock size={18} style={s.inputIcon} />
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  style={s.input}
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div style={s.inputGroup}>
              <label style={s.label}>Confirm Password</label>
              <div style={s.inputWrapper}>
                <Icons.CheckCircle size={18} style={s.inputIcon} />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={s.input}
                />
              </div>
            </div>

            <button type="submit" style={isLoading ? s.buttonLoading : s.button} disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Register"}
              {!isLoading && <Icons.ArrowRight size={16} />}
            </button>
          </form>

          <p style={s.footerText}>
            Already have an account? <Link to="/login" style={s.link}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const s = {
  pageWrapper: {
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#f8fafc", // Slate-50
    display: "flex",
    flexDirection: "column",
  },
  centerContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: "450px", // Slightly wider than login for more inputs
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e2e8f0",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    backgroundColor: "#3b82f6",
    color: "white",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    margin: "0 auto 20px auto",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#334155",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    color: "#94a3b8",
  },
  input: {
    width: "100%",
    padding: "10px 12px 10px 40px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    color: "#0f172a",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    marginTop: "10px",
    backgroundColor: "#0f172a",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "background 0.2s",
  },
  buttonLoading: {
    marginTop: "10px",
    backgroundColor: "#94a3b8",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorAlert: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  footerText: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "0.9rem",
    color: "#64748b",
  },
  link: {
    color: "#3b82f6",
    fontWeight: "600",
    textDecoration: "none",
  },
};