import { configureStore } from "@reduxjs/toolkit"
import authReducer     from "../Features/auth/auth.slice"
import registerReducer from "../Features/auth/register.slice"

export const store = configureStore({
    reducer: {
        auth:     authReducer,
        register: registerReducer,
    }
})
