import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Home() {
  const { token } = useAuth();

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1>API Monitoring System</h1>

        <p style={styles.text}>
          This application monitors the health, performance, and usage of internal APIs.
          It provides rate limiting, analytics, and role-based access for administrators
          and users.
        </p>

        {!token ? (
          <div>
            <Link to="/login">
              <button style={styles.button}>Login</button>
            </Link>

            <Link to="/register">
              <button style={styles.buttonSecondary}>Register</button>
            </Link>
          </div>
        ) : (
          <Link to="/dashboard">
            <button style={styles.button}>Go to Dashboard</button>
          </Link>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "60px auto",
    textAlign: "center"
  },
  text: {
    marginTop: "20px",
    color: "#444"
  },
  button: {
    marginTop: "20px",
    marginRight: "10px",
    padding: "10px 20px",
    cursor: "pointer"
  },
  buttonSecondary: {
    marginTop: "20px",
    padding: "10px 20px",
    cursor: "pointer"
  }
};
