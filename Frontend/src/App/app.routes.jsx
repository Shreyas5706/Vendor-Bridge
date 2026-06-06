import { createBrowserRouter, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Dashboard      from "../Features/DaashBoard/DashBoard";
import LoginPage      from "../Features/auth/page/LoginPage";
import ForgotPasswordPage from "../Features/auth/page/ForgotPasswordPage";
import RegisterPage   from "../Features/auth/page/RegisterPage";
import CompanyPage    from "../Features/DaashBoard/CompanyPage";
import VendorPage     from "../Features/DaashBoard/VendorPage";
import CreateRFQPage  from "../Features/RFQ/CreateRFQPage";
import NotFoundPage   from "../components/NotFoundPage";
// A simple PrivateRoute wrapper to check if user exists
function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/Login" replace />;
}

// A simple PublicRoute wrapper to block authenticated users and redirect by role
function PublicRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  if (user) {
    if (user.role === 'VENDOR') {
      return <Navigate to="/vendor" replace />;
    }
    return <Navigate to="/company" replace />;
  }
  return children;
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
        path: "/forgot-password",
        element: (
          <PublicRoute>
            <ForgotPasswordPage />
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
        path: "/vendor",
        element: (
          <PrivateRoute>
            <VendorPage />
          </PrivateRoute>
        ),
    },
    {
        path: "/rfq/create",
        element: (
          <PrivateRoute>
            <CreateRFQPage />
          </PrivateRoute>
        ),
    },

    {
        // Catch-all: any unknown route → 404 page
        path: "*",
        element: <NotFoundPage />,
    },
]);


