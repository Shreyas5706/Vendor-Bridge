import { createBrowserRouter, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Dashboard      from "../Features/DaashBoard/DashBoard";
import LoginPage      from "../Features/auth/page/LoginPage";
import RegisterPage   from "../Features/auth/page/RegisterPage";
import CompanyPage    from "../Features/DaashBoard/CompanyPage";
import CreateRFQPage  from "../Features/RFQ/CreateRFQPage";
import NotFoundPage   from "../components/NotFoundPage";
// A simple PrivateRoute wrapper to check if user exists
function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/Login" replace />;
}

// A simple PublicRoute wrapper to block authenticated users
function PublicRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user ? <Navigate to="/company" replace /> : children;
}

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
          <PublicRoute>
            <Dashboard />
          </PublicRoute>
        ),
    },
    {
        path: "/Login",
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
    },
    {
        path: "/register",
        element: (
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        ),
    },
    {
        path: "/company",
        element: (
          <PrivateRoute>
            <CompanyPage />
          </PrivateRoute>
        ),
    },
    {
        path: "/rfq/create",
        element: (
            <CreateRFQPage />
        ),
    },

    {
        // Catch-all: any unknown route → 404 page
        path: "*",
        element: <NotFoundPage />,
    },
]);


