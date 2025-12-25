import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <h3 style={styles.logo}>API Monitoring System</h3>

      <div>
        {!token ? (
          <>
            <Link style={styles.link} to="/login">Login</Link>
            <Link style={styles.link} to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link style={styles.link} to="/dashboard">Dashboard</Link>
            <button style={styles.button} onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderBottom: "1px solid #ddd"
  },
  logo: {
    margin: 0
  },
  link: {
    marginRight: "16px",
    textDecoration: "none"
  },
  button: {
    cursor: "pointer"
  }
};
