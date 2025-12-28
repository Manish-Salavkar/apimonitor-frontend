import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import * as Icons from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1️⃣ OAuth2 login (form-encoded)
      const formData = new URLSearchParams();
      formData.append("username", email); 
      formData.append("password", password);

      const loginRes = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const token = loginRes.data.access_token;

      // 2️⃣ TEMPORARILY store token so axios interceptor can use it
      localStorage.setItem("token", token);

      // 3️⃣ Fetch user profile
      const userRes = await api.get("/auth/me");
      const user = userRes.data;

      // 4️⃣ Store token + user in context
      login(token, user);
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
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
            <h2 style={s.title}>Welcome back</h2>
            <p style={s.subtitle}>Enter your credentials to access the dashboard.</p>
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

            {/* Password Input */}
            <div style={s.inputGroup}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrapper}>
                <Icons.Lock size={18} style={s.inputIcon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  style={s.input}
                />
              </div>
            </div>

            <button type="submit" style={isLoading ? s.buttonLoading : s.button} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <Icons.ArrowRight size={16} />}
            </button>
          </form>

          <p style={s.footerText}>
            Don’t have an account? <Link to="/register" style={s.link}>Create an account</Link>
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
    maxWidth: "400px",
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
    padding: "10px 12px 10px 40px", // Padding left for icon
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