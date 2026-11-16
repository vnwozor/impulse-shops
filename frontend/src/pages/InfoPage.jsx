import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useStore } from "../context/Store";
import { money, waLink } from "../lib/api";
import Accordion from "../components/Accordion";

const PAGES = {
    about: { title: "About us", eyebrow: "Impulse.shops by Mainroadlife", path: "/about" },
    faq: { title: "Questions, answered", eyebrow: "FAQ", path: "/faq" },
    shipping: { title: "Delivery", eyebrow: "Help", path: "/delivery" },
    returns: { title: "Returns", eyebrow: "Help", path: "/returns" },
    authenticity: { title: "Authenticity", eyebrow: "Our promise", path: "/authenticity" },
    privacy: { title: "Privacy", eyebrow: "Help", path: "/privacy" },
};

export default function InfoPage({ page }) {
    const { settings } = useStore();
    const meta = PAGES[page];
    const c = settings.content;

    useEffect(() => {
        document.title = `${meta.title} — Impulse.shops`;
    }, [meta.title]);

    return (
        <div className="wrap info">
            <aside className="info__nav">
                {Object.entries(PAGES).map(([key, p]) => (
                    <NavLink key={key} to={p.path}>{key === "faq" ? "FAQ" : p.title}</NavLink>
                ))}
            </aside>

            <article className="info__body">
                <p className="eyebrow">{meta.eyebrow}</p>
                <h1 className="display-xl">{meta.title}</h1>

                {page === "faq" ? (
                    <div className="info__faq">
                        {c.faq.map((f, i) => (
                            <Accordion key={i} title={f.q} defaultOpen={i === 0}><p className="prewrap">{f.a}</p></Accordion>
                        ))}
                    </div>
                ) : (
                    <div className="prose">
                        {(c[page] || "").split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                )}

                {page === "shipping" && (
                    <table className="table">
                        <thead><tr><th>Area</th><th>Fee</th><th>Timing</th></tr></thead>
                        <tbody>
                            {settings.delivery.zones.map((z) => (
                                <tr key={z.id}><td>{z.name}</td><td>{z.fee ? money(z.fee) : "Free"}</td><td>{z.eta}</td></tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="info__help">
                    <p>Still have a question?</p>
                    <a href={waLink(settings.store.whatsapp)} target="_blank" rel="noreferrer" className="link-under">Message us on WhatsApp</a>
                    <span className="muted">or</span>
                    <a href={`mailto:${settings.store.email}`} className="link-under">send an email</a>
                </div>
                {page === "about" && <Link to="/shop" className="btn btn--ink">Shop the collection</Link>}
            </article>
        </div>
    );
}
