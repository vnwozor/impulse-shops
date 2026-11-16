import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, getToken, handleUnauthorized, setToken } from "./api";

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }) {
    const [token, setTok] = useState(getToken);
    const [settings, setSettings] = useState(null);
    const [states, setStates] = useState([]);
    const [cardAvailable, setCardAvailable] = useState(false);
    const [categories, setCategories] = useState([]);
    const [toast, setToast] = useState(null);
    const [confirmState, setConfirmState] = useState(null);
    const timer = useRef();

    const signIn = (t) => {
        setToken(t);
        setTok(t);
    };
    const signOut = useCallback(() => {
        setToken("");
        setTok("");
    }, []);

    useEffect(() => {
        handleUnauthorized(signOut);
    }, [signOut]);

    const notify = useCallback((message, tone = "ok") => {
        clearTimeout(timer.current);
        setToast({ message, tone });
        timer.current = setTimeout(() => setToast(null), 3400);
    }, []);

    const loadSettings = useCallback(async () => {
        const d = await api("/settings");
        setSettings(d.settings);
        setStates(d.states);
        setCardAvailable(d.cardAvailable);
    }, []);

    const loadCategories = useCallback(async () => {
        const d = await api("/categories");
        setCategories(d.categories);
    }, []);

    useEffect(() => {
        if (!token) return;
        api("/admin/me").catch(() => {});
        loadSettings().catch((e) => notify(e.message, "error"));
        loadCategories().catch(() => {});
    }, [token, loadSettings, loadCategories, notify]);

    const saveSection = useCallback(async (section, value) => {
        const d = await api(`/admin/settings/${section}`, { method: "PUT", body: { value } });
        setSettings(d.settings);
        return d.settings;
    }, []);

    // promise-based confirm dialog
    const confirm = useCallback((opts) => new Promise((resolve) => setConfirmState({ ...opts, resolve })), []);

    const value = useMemo(
        () => ({ token, signIn, signOut, settings, states, cardAvailable, saveSection, categories, loadCategories, notify, confirm }),
        [token, signOut, settings, states, cardAvailable, saveSection, categories, loadCategories, notify, confirm]
    );

    return (
        <AdminContext.Provider value={value}>
            {children}
            <div className={`toast ${toast ? "is-on" : ""} ${toast?.tone === "error" ? "is-error" : ""}`} role="status" aria-live="polite">
                {toast?.message}
            </div>
            {confirmState && (
                <div className="modal" role="dialog" aria-modal="true">
                    <div className="modal__scrim" onClick={() => { confirmState.resolve(false); setConfirmState(null); }} />
                    <div className="modal__box">
                        <h3>{confirmState.title}</h3>
                        {confirmState.body && <p>{confirmState.body}</p>}
                        <div className="modal__actions">
                            <button className="btn btn--ghost" onClick={() => { confirmState.resolve(false); setConfirmState(null); }}>Cancel</button>
                            <button className={`btn ${confirmState.danger ? "btn--danger" : "btn--ink"}`} autoFocus onClick={() => { confirmState.resolve(true); setConfirmState(null); }}>
                                {confirmState.action || "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminContext.Provider>
    );
}
