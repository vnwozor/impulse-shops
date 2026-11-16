import { useSection } from "../lib/useSection";
import { STORE_URL } from "../lib/api";
import { Area, Card, Field, Icon, ImageField, PageHead, SaveBar, Toggle } from "../components/ui";
import { useAdmin } from "../lib/admin";

export default function Storefront() {
    const hero = useSection("hero");
    const home = useSection("home");
    const ann = useSection("announcement");
    const { notify } = useAdmin();

    const dirty = hero.dirty || home.dirty || ann.dirty;
    const saving = hero.saving || home.saving || ann.saving;
    const saveAll = async () => {
        if (hero.draft.slides.some((s) => !s.image)) return notify("Every slide needs an image", "error");
        if (hero.dirty) await hero.save();
        if (home.dirty) await home.save();
        if (ann.dirty) await ann.save();
    };
    const resetAll = () => { hero.reset(); home.reset(); ann.reset(); };

    const slides = hero.draft.slides;
    const setSlide = (i, k, v) => hero.setDraft((d) => ({ ...d, slides: d.slides.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));
    const moveSlide = (i, dir) => hero.setDraft((d) => {
        const s = [...d.slides];
        const j = i + dir;
        if (j < 0 || j >= s.length) return d;
        [s[i], s[j]] = [s[j], s[i]];
        return { ...d, slides: s };
    });

    return (
        <div className="page page--form">
            <PageHead title="Homepage" sub="The banner, slides and sections customers see first.">
                <a href={STORE_URL} target="_blank" rel="noreferrer" className="btn btn--ghost"><Icon name="external" size={16} /> Open website</a>
            </PageHead>

            <div className="stack">
                <Card title="Announcement bar" sub="The thin strip at the very top of every page.">
                    <div className="fields">
                        <Toggle checked={ann.draft.enabled} onChange={(v) => ann.set("enabled", v)} label="Show announcement bar" />
                        <Field label="Message" value={ann.draft.text} onChange={(e) => ann.set("text", e.target.value)} placeholder="Same-day delivery across Lagos" maxLength={140} />
                    </div>
                </Card>

                <Card
                    title="Hero slides"
                    sub="Large images at the top of the homepage. Use wide photos, at least 2000px across."
                    action={
                        <div className="inline">
                            <label className="inline-field">
                                Change every
                                <input type="number" min="3" max="20" value={hero.draft.interval} onChange={(e) => hero.set("interval", Number(e.target.value))} />
                                seconds
                            </label>
                        </div>
                    }
                >
                    <div className="slides">
                        {slides.map((s, i) => (
                            <div key={i} className="slide">
                                <div className="slide__head">
                                    <span className="mono">Slide {String(i + 1).padStart(2, "0")}</span>
                                    <div className="inline">
                                        <button className="iconbtn" onClick={() => moveSlide(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" size={15} /></button>
                                        <button className="iconbtn" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} aria-label="Move down"><Icon name="down" size={15} /></button>
                                        <button className="iconbtn iconbtn--danger" onClick={() => hero.setDraft((d) => ({ ...d, slides: d.slides.filter((_, j) => j !== i) }))} aria-label="Remove slide"><Icon name="trash" size={15} /></button>
                                    </div>
                                </div>
                                <div className="slide__grid">
                                    <ImageField label="Image" value={s.image} onChange={(v) => setSlide(i, "image", v)} ratio="16 / 9" />
                                    <div className="fields">
                                        <Field label="Small label" value={s.eyebrow} onChange={(e) => setSlide(i, "eyebrow", e.target.value)} placeholder="New season" />
                                        <Area label="Headline" rows={2} value={s.title} onChange={(e) => setSlide(i, "title", e.target.value)} hint="Press Enter for a new line. Short lines look best." />
                                        <div className="fields fields--2">
                                            <Field label="Button text" value={s.ctaLabel} onChange={(e) => setSlide(i, "ctaLabel", e.target.value)} />
                                            <Field label="Button link" value={s.ctaLink} onChange={(e) => setSlide(i, "ctaLink", e.target.value)} placeholder="/shop/bags" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {slides.length < 6 && (
                            <button className="addrow" onClick={() => hero.setDraft((d) => ({ ...d, slides: [...d.slides, { image: "", eyebrow: "", title: "", ctaLabel: "Shop now", ctaLink: "/shop" }] }))}>
                                <Icon name="plus" size={16} /> Add slide
                            </button>
                        )}
                    </div>
                </Card>

                <Card title="Section titles">
                    <div className="fields fields--2">
                        <Field label="New arrivals section" value={home.draft.newInTitle} onChange={(e) => home.set("newInTitle", e.target.value)} />
                        <Field label="Featured section" value={home.draft.bestTitle} onChange={(e) => home.set("bestTitle", e.target.value)} hint="Shows products you mark as Featured" />
                    </div>
                </Card>

                <Card title="Story block" sub="The large image with text halfway down the homepage.">
                    <div className="slide__grid">
                        <ImageField label="Image" value={home.draft.editorial.image} onChange={(v) => home.set("editorial.image", v)} ratio="4 / 5" />
                        <div className="fields">
                            <Field label="Small label" value={home.draft.editorial.eyebrow} onChange={(e) => home.set("editorial.eyebrow", e.target.value)} />
                            <Area label="Headline" rows={2} value={home.draft.editorial.title} onChange={(e) => home.set("editorial.title", e.target.value)} />
                            <Area label="Text" rows={5} value={home.draft.editorial.body} onChange={(e) => home.set("editorial.body", e.target.value)} />
                            <div className="fields fields--2">
                                <Field label="Link text" value={home.draft.editorial.ctaLabel} onChange={(e) => home.set("editorial.ctaLabel", e.target.value)} />
                                <Field label="Link" value={home.draft.editorial.ctaLink} onChange={(e) => home.set("editorial.ctaLink", e.target.value)} />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Sourcing block" sub="The blue band near the bottom that opens WhatsApp.">
                    <div className="fields">
                        <Field label="Headline" value={home.draft.concierge.title} onChange={(e) => home.set("concierge.title", e.target.value)} />
                        <Area label="Text" rows={2} value={home.draft.concierge.body} onChange={(e) => home.set("concierge.body", e.target.value)} />
                    </div>
                </Card>
            </div>

            <SaveBar dirty={dirty} saving={saving} onSave={saveAll} onReset={resetAll} />
        </div>
    );
}
