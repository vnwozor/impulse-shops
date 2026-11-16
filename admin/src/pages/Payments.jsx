import { useSection } from "../lib/useSection";
import { useAdmin } from "../lib/admin";
import { Badge, Card, Field, PageHead, SaveBar, Toggle } from "../components/ui";

export default function Payments() {
    const { cardAvailable } = useAdmin();
    const { draft, set, dirty, saving, save, reset } = useSection("payments");

    return (
        <div className="page page--form">
            <PageHead title="Payments" sub="Choose how customers can pay at checkout." />

            <div className="stack">
                <Card title="Card payments" action={cardAvailable ? <Badge tone="ok">Paystack connected</Badge> : <Badge tone="warn">Not connected</Badge>}>
                    <div className="fields">
                        <Toggle checked={draft.card.enabled} onChange={(v) => set("card.enabled", v)} label="Offer card payment" hint="Card, bank transfer and USSD through Paystack's secure page. Orders are marked paid automatically." />
                        {!cardAvailable && (
                            <p className="infoline">To switch this on, add your Paystack secret key as <code>PAYSTACK_SECRET_KEY</code> in the server settings, then restart the server. Until then, customers won't see this option.</p>
                        )}
                    </div>
                </Card>

                <Card title="Bank transfer">
                    <div className="fields">
                        <Toggle checked={draft.transfer.enabled} onChange={(v) => set("transfer.enabled", v)} label="Offer bank transfer" hint="Customers see these details after placing the order. You mark the order paid once the money arrives." />
                        {draft.transfer.enabled && (
                            <div className="fields fields--3">
                                <Field label="Bank" value={draft.transfer.bankName} onChange={(e) => set("transfer.bankName", e.target.value)} placeholder="e.g. GTBank" />
                                <Field label="Account name" value={draft.transfer.accountName} onChange={(e) => set("transfer.accountName", e.target.value)} />
                                <Field label="Account number" value={draft.transfer.accountNumber} onChange={(e) => set("transfer.accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" />
                            </div>
                        )}
                        {draft.transfer.enabled && !draft.transfer.accountNumber && (
                            <p className="infoline">No account details yet. Customers will be asked to get them from you on WhatsApp.</p>
                        )}
                    </div>
                </Card>

                <Card title="WhatsApp">
                    <Toggle checked={draft.whatsapp.enabled} onChange={(v) => set("whatsapp.enabled", v)} label="Let customers finish on WhatsApp" hint="The order is reserved and the customer sends you the details in chat to agree payment." />
                </Card>
            </div>

            <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
        </div>
    );
}
