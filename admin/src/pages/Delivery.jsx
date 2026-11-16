import { useSection } from "../lib/useSection";
import { useAdmin } from "../lib/admin";
import { money } from "../lib/api";
import { Area, Card, Field, Icon, PageHead, SaveBar, Toggle } from "../components/ui";

export default function Delivery() {
    const { states } = useAdmin();
    const { draft, setDraft, set, dirty, saving, save, reset } = useSection("delivery");

    const setZone = (i, k, v) => setDraft((d) => ({ ...d, zones: d.zones.map((z, j) => (j === i ? { ...z, [k]: v } : z)) }));
    const covered = new Set(draft.zones.flatMap((z) => z.states));
    const catchAll = draft.zones.find((z) => z.states.length === 0);

    return (
        <div className="page page--form">
            <PageHead title="Delivery" sub="Fees are added at checkout based on the customer's state." />

            <div className="stack">
                <Card title="Free delivery">
                    <Field
                        label="Free delivery on orders over (₦)"
                        type="number" min="0"
                        value={draft.freeOver}
                        onChange={(e) => set("freeOver", Number(e.target.value))}
                        hint={draft.freeOver ? `Orders of ${money(draft.freeOver)} or more ship free. Set 0 to turn off.` : "Free delivery is off."}
                    />
                </Card>

                <Card title="Delivery zones" sub="If a state is in more than one zone, the customer picks which one (useful for Lagos Mainland vs Island). A zone with no states covers everywhere else.">
                    <div className="zones-edit">
                        {draft.zones.map((z, i) => (
                            <div key={z.id || i} className="zone">
                                <div className="fields fields--3">
                                    <Field label="Zone name" value={z.name} onChange={(e) => setZone(i, "name", e.target.value)} />
                                    <Field label="Fee (₦)" type="number" min="0" value={z.fee} onChange={(e) => setZone(i, "fee", Number(e.target.value))} />
                                    <Field label="Delivery time" value={z.eta} onChange={(e) => setZone(i, "eta", e.target.value)} placeholder="1–2 working days" />
                                </div>
                                <div className="field">
                                    <span className="field__label">States {z.states.length === 0 && <em className="muted">— covers every state not listed elsewhere</em>}</span>
                                    <div className="chips">
                                        {z.states.map((s) => (
                                            <span key={s} className="chip">{s}<button type="button" onClick={() => setZone(i, "states", z.states.filter((x) => x !== s))} aria-label={`Remove ${s}`}><Icon name="close" size={12} /></button></span>
                                        ))}
                                        <select className="chip-select" value="" onChange={(e) => e.target.value && setZone(i, "states", [...z.states, e.target.value])}>
                                            <option value="">+ Add state</option>
                                            {states.filter((s) => !z.states.includes(s)).map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button className="btn btn--danger-ghost btn--sm zone__remove" onClick={() => setDraft((d) => ({ ...d, zones: d.zones.filter((_, j) => j !== i) }))}>Remove zone</button>
                            </div>
                        ))}
                        <button className="addrow" onClick={() => setDraft((d) => ({ ...d, zones: [...d.zones, { id: Math.random().toString(36).slice(2, 9), name: "", states: [], fee: 0, eta: "" }] }))}>
                            <Icon name="plus" size={16} /> Add zone
                        </button>
                    </div>
                    {!catchAll && (
                        <p className="warnline">{states.length - covered.size} states aren't covered by any zone, so customers there can't check out. Add a zone with no states to cover them.</p>
                    )}
                </Card>

                <Card title="Pickup">
                    <div className="fields">
                        <Toggle checked={draft.pickup.enabled} onChange={(v) => set("pickup.enabled", v)} label="Let customers pick up their order" />
                        {draft.pickup.enabled && (
                            <>
                                <Field label="Option name" value={draft.pickup.label} onChange={(e) => set("pickup.label", e.target.value)} />
                                <Area label="What customers see" rows={2} value={draft.pickup.note} onChange={(e) => set("pickup.note", e.target.value)} />
                            </>
                        )}
                    </div>
                </Card>
            </div>

            <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
        </div>
    );
}
