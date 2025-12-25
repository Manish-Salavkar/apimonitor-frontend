import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1️⃣ OAuth2 login (form-encoded)
      const formData = new URLSearchParams();
      formData.append("username", email); // OAuth2 uses "username"
      formData.append("password", password);

      const loginRes = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      const token = loginRes.data.access_token;

      // 2️⃣ TEMPORARILY store token so axios interceptor can use it
      localStorage.setItem("token", token);

      // 3️⃣ Fetch user profile
      const userRes = await api.get("/auth/me");
      const user = userRes.data;

      // 4️⃣ Store token + user in context (single source of truth)
      login(token, user);

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2>Login</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        <p>
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "60px auto",
    textAlign: "center"
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0"
  },
  button: {
    padding: "10px 20px",
    width: "100%",
    cursor: "pointer"
  },
  error: {
    color: "red"
  }
};
