import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AdminProvider } from "./lib/admin";
import App from "./App";
import "./styles/admin.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AdminProvider>
                <App />
            </AdminProvider>
        </BrowserRouter>
    </React.StrictMode>
);
