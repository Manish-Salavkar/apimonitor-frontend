import { useAuth } from "../context/AuthContext";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      {user?.role_id === 1 ? <AdminDashboard /> : <UserDashboard />}
    </>
  );
}
