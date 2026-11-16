import { useState } from "react";
import { api } from "../lib/api";
import { useAdmin } from "../lib/admin";
import lockup from "../assets/lockup.webp";

export default function Login() {
    const { signIn } = useAdmin();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const d = await api("/admin/login", { method: "POST", body: form });
            signIn(d.token);
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    };

    return (
        <div className="login">
            <div className="login__art">
                <img src={lockup} alt="Impulse.shops — Authentic Luxury. Trusted Always." />
            </div>
            <div className="login__panel">
                <form onSubmit={submit} className="login__form">
                    <p className="eyebrow">Impulse.shops</p>
                    <h1>Sign in to manage your store</h1>
                    <label className="field">
                        <span className="field__label">Email</span>
                        <input type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoFocus />
                    </label>
                    <label className="field">
                        <span className="field__label">Password</span>
                        <input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button className="btn btn--ink btn--lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
                    <p className="login__note">Only the store owner has access. Your session stays signed in for 7 days on this device.</p>
                </form>
            </div>
        </div>
    );
}
