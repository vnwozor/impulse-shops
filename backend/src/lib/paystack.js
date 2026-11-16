const BASE = "https://api.paystack.co";

export const paystackEnabled = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

async function call(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.status) throw new Error(data.message || "Paystack request failed");
    return data.data;
}

// amount is in naira; Paystack wants kobo
export const initializePayment = ({ email, amount, reference, callbackUrl, metadata }) =>
    call("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({ email, amount: Math.round(amount * 100), reference, callback_url: callbackUrl, metadata }),
    });

export const verifyPayment = (reference) => call(`/transaction/verify/${encodeURIComponent(reference)}`);
