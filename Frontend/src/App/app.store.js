import { configureStore } from "@reduxjs/toolkit"
import authReducer     from "../Features/auth/auth.slice"
import forgotPasswordReducer from "../Features/auth/forgotPassword.slice"
import registerReducer from "../Features/auth/register.slice"
import rfqReducer      from "../Features/RFQ/rfq.slice"

export const store = configureStore({
    reducer: {
        auth:     authReducer,
        forgotPassword: forgotPasswordReducer,
        register: registerReducer,
        rfq:      rfqReducer,
    }
})
