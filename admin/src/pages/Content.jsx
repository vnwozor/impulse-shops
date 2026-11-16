import { useState } from "react";
import { useSection } from "../lib/useSection";
import { STORE_URL } from "../lib/api";
import { Area, Card, Field, Icon, PageHead, SaveBar } from "../components/ui";

const PAGES = [
    ["about", "About us", "/about"],
    ["authenticity", "Authenticity", "/authenticity"],
    ["shipping", "Delivery", "/delivery"],
    ["returns", "Returns", "/returns"],
    ["privacy", "Privacy", "/privacy"],
];

export default function Content() {
    const { draft, setDraft, set, dirty, saving, save, reset } = useSection("content");
    const [tab, setTab] = useState("about");

    const setFaq = (i, k, v) => setDraft((d) => ({ ...d, faq: d.faq.map((f, j) => (j === i ? { ...f, [k]: v } : f)) }));
    const moveFaq = (i, dir) => setDraft((d) => {
        const f = [...d.faq];
        const j = i + dir;
        if (j < 0 || j >= f.length) return d;
        [f[i], f[j]] = [f[j], f[i]];
        return { ...d, faq: f };
    });

    const page = PAGES.find((p) => p[0] === tab);

    return (
        <div className="page page--form">
            <PageHead title="Pages & FAQ" sub="The text on your information pages. Leave a blank line between paragraphs." />

            <div className="toolbar">
                <div className="tabs">
                    {PAGES.map(([k, l]) => <button key={k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>{l}</button>)}
                    <button className={tab === "faq" ? "is-active" : ""} onClick={() => setTab("faq")}>FAQ <span className="tabs__n">{draft.faq.length}</span></button>
                </div>
            </div>

            {tab === "faq" ? (
                <Card title="Frequently asked questions" action={<a className="link" href={`${STORE_URL}/faq`} target="_blank" rel="noreferrer">View page</a>}>
                    <div className="faq-edit">
                        {draft.faq.map((f, i) => (
                            <div key={i} className="faq-item">
                                <div className="fields">
                                    <Field label={`Question ${i + 1}`} value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} />
                                    <Area label="Answer" rows={3} value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} />
                                </div>
                                <div className="faq-item__tools">
                                    <button className="iconbtn" onClick={() => moveFaq(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" size={15} /></button>
                                    <button className="iconbtn" onClick={() => moveFaq(i, 1)} disabled={i === draft.faq.length - 1} aria-label="Move down"><Icon name="down" size={15} /></button>
                                    <button className="iconbtn iconbtn--danger" onClick={() => setDraft((d) => ({ ...d, faq: d.faq.filter((_, j) => j !== i) }))} aria-label="Remove"><Icon name="trash" size={15} /></button>
                                </div>
                            </div>
                        ))}
                        <button className="addrow" onClick={() => setDraft((d) => ({ ...d, faq: [...d.faq, { q: "", a: "" }] }))}><Icon name="plus" size={16} /> Add question</button>
                    </div>
                </Card>
            ) : (
                <Card title={page[1]} action={<a className="link" href={`${STORE_URL}${page[2]}`} target="_blank" rel="noreferrer">View page</a>}>
                    <Area rows={16} value={draft[tab]} onChange={(e) => set(tab, e.target.value)} className="area-lg" />
                </Card>
            )}

            <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
        </div>
    );
}
