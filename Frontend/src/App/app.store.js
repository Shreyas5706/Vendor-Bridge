import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../Features/auth/auth.slice"


export const store = configureStore({
    reducer:{
        auth:authReducer
    }
})

