import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/Store";
import { api, waLink } from "../lib/api";
import { IconArrow } from "./Icons";

export default function Footer() {
    const { settings, categories } = useStore();
    const s = settings.store;
    const [email, setEmail] = useState("");
    const [state, setState] = useState({ status: "idle", message: "" });

    const subscribe = async (e) => {
        e.preventDefault();
        setState({ status: "busy", message: "" });
        try {
            await api("/subscribe", { method: "POST", body: { email } });
            setState({ status: "done", message: "You're on the list. New pieces land in your inbox first." });
            setEmail("");
        } catch (err) {
            setState({ status: "error", message: err.message });
        }
    };

    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="wrap">
                <div className="footer__top">
                    <div className="footer__news">
                        <p className="display-m">New pieces, first.</p>
                        <p className="footer__muted">One short email when something worth seeing arrives. Nothing else.</p>
                        <form onSubmit={subscribe} className="footer__form">
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" aria-label="Email address" />
                            <button type="submit" disabled={state.status === "busy"} aria-label="Subscribe"><IconArrow /></button>
                        </form>
                        {state.message && <p className={`footer__note ${state.status === "error" ? "is-error" : ""}`}>{state.message}</p>}
                    </div>

                    <div className="footer__cols">
                        <div>
                            <p className="eyebrow">Shop</p>
                            <ul>
                                {categories.slice(0, 7).map((c) => (
                                    <li key={c._id}><Link to={`/shop/${c.slug}`}>{c.name}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="eyebrow">Help</p>
                            <ul>
                                <li><Link to="/track">Track an order</Link></li>
                                <li><Link to="/delivery">Delivery</Link></li>
                                <li><Link to="/returns">Returns</Link></li>
                                <li><Link to="/authenticity">Authenticity</Link></li>
                                <li><Link to="/faq">FAQ</Link></li>
                                <li><Link to="/privacy">Privacy</Link></li>
                            </ul>
                        </div>
                        <div>
                            <p className="eyebrow">Contact</p>
                            <ul>
                                <li><a href={waLink(s.whatsapp)} target="_blank" rel="noreferrer">WhatsApp</a></li>
                                <li><a href={`tel:${s.phone}`}>{s.phone}</a></li>
                                <li><a href={`mailto:${s.email}`} className="break">{s.email}</a></li>
                                <li className="footer__muted">{s.location}</li>
                            </ul>
                        </div>
                        <div>
                            <p className="eyebrow">Follow</p>
                            <ul>
                                {s.instagram && <li><a href={s.instagram} target="_blank" rel="noreferrer">Instagram</a></li>}
                                {s.tiktok && <li><a href={s.tiktok} target="_blank" rel="noreferrer">TikTok</a></li>}
                                {s.facebook && <li><a href={s.facebook} target="_blank" rel="noreferrer">Facebook</a></li>}
                            </ul>
                        </div>
                    </div>
                </div>

                <p className="footer__mark" aria-hidden="true">Impulse<span>.</span>shops</p>

                <div className="footer__bottom">
                    <span>© {year} {s.legalName}</span>
                    <span>{s.tagline}</span>
                    <span>Lagos, Nigeria</span>
                </div>
            </div>
        </footer>
    );
}
