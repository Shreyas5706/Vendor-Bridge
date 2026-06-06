import { createBrowserRouter } from "react-router-dom";
import Dashboard from "../Features/DaashBoard/DashBoard";
import LoginPage from "../Features/DaashBoard/auth/page/LoginPage";



export const router = createBrowserRouter([
    {
        path:"/",
        element:<Dashboard></Dashboard>
    },
    {
        path:"/Login",
        element:<LoginPage></LoginPage>
    }
])