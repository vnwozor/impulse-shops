import { useSection } from "../lib/useSection";
import { Card, Field, PageHead, SaveBar } from "../components/ui";

export default function StoreDetails() {
    const { draft, set, dirty, saving, save, reset } = useSection("store");

    return (
        <div className="page page--form">
            <PageHead title="Store details" sub="Shown in the footer, on order pages and in WhatsApp links." />

            <div className="stack">
                <Card title="Brand">
                    <div className="fields fields--2">
                        <Field label="Store name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
                        <Field label="Full name" value={draft.legalName} onChange={(e) => set("legalName", e.target.value)} hint="Used in the footer copyright line" />
                        <Field className="span-2" label="Tagline" value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
                    </div>
                </Card>

                <Card title="Contact">
                    <div className="fields fields--2">
                        <Field label="Phone" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
                        <Field label="WhatsApp number" value={draft.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} hint="With country code, e.g. 2348123378722. Every WhatsApp button uses this." />
                        <Field label="Email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
                        <Field label="Location" value={draft.location} onChange={(e) => set("location", e.target.value)} />
                    </div>
                </Card>

                <Card title="Social media" sub="Paste the full link to each profile. Leave blank to hide it.">
                    <div className="fields">
                        <Field label="Instagram" value={draft.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://www.instagram.com/..." />
                        <Field label="TikTok" value={draft.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="https://www.tiktok.com/@..." />
                        <Field label="Facebook" value={draft.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://www.facebook.com/..." />
                    </div>
                </Card>
            </div>

            <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
        </div>
    );
}
