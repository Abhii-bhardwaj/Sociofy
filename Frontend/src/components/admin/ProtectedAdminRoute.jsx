import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
const ProtectedAdminRoute = () => {
  const { authUser } = useAuthStore(); // If no authenticated user, redirect to login
  if (!authUser) {
    return <Navigate to="/login" />;
  } // If user is not an admin, redirect to home
  if (authUser.role !== "admin") {
    return <Navigate to="/" />;
  } // User is authenticated and is an admin, render the outlet
  return <Outlet />;
};
export default ProtectedAdminRoute;
