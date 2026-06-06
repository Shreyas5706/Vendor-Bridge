import { createBrowserRouter } from "react-router-dom";
import Dashboard from "../Features/DaashBoard/DashBoard";



export const router = createBrowserRouter([
    {
        path:"/",
        element:<Dashboard></Dashboard>
    }
])