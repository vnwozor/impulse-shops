import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const CART_KEY = "impulse.bag.v1";

const readCart = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
};

export function StoreProvider({ children }) {
    const [settings, setSettings] = useState(null);
    const [meta, setMeta] = useState({ cardAvailable: false, states: [] });
    const [categories, setCategories] = useState([]);
    const [loadError, setLoadError] = useState("");
    const [cart, setCart] = useState(readCart);
    const [bagOpen, setBagOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef();

    useEffect(() => {
        Promise.all([api("/settings"), api("/categories")])
            .then(([s, c]) => {
                setSettings(s.settings);
                setMeta({ cardAvailable: s.cardAvailable, states: s.states });
                setCategories(c.categories);
            })
            .catch((e) => setLoadError(e.message));
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch {
            /* private mode: the bag simply won't survive a reload */
        }
    }, [cart]);

    const notify = useCallback((message) => {
        clearTimeout(toastTimer.current);
        setToast(message);
        toastTimer.current = setTimeout(() => setToast(null), 3200);
    }, []);

    // a line in the bag is one product in one option (size, length...)
    const lineKey = (productId, option) => `${productId}::${option || ""}`;

    const addToBag = useCallback((product, option, qty = 1) => {
        setCart((prev) => {
            const key = lineKey(product._id, option);
            const existing = prev.find((l) => l.key === key);
            const max = product.stock;
            if (existing) {
                return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(max, l.qty + qty), stock: max } : l));
            }
            return [
                ...prev,
                {
                    key,
                    productId: product._id,
                    slug: product.slug,
                    name: product.name,
                    image: product.images?.[0] || "",
                    price: product.price,
                    option: option || "",
                    optionLabel: product.options?.label || "",
                    stock: max,
                    qty: Math.min(max, qty),
                },
            ];
        });
        setBagOpen(true);
    }, []);

    const setQty = useCallback((key, qty) => {
        setCart((prev) =>
            prev.flatMap((l) => (l.key !== key ? [l] : qty <= 0 ? [] : [{ ...l, qty: Math.min(qty, l.stock || 20) }]))
        );
    }, []);

    const removeLine = useCallback((key) => setCart((prev) => prev.filter((l) => l.key !== key)), []);
    const clearBag = useCallback(() => setCart([]), []);

    const count = cart.reduce((n, l) => n + l.qty, 0);
    const subtotal = cart.reduce((n, l) => n + l.qty * l.price, 0);

    const value = useMemo(
        () => ({
            settings, meta, categories, loadError,
            cart, count, subtotal, addToBag, setQty, removeLine, clearBag,
            bagOpen, setBagOpen, toast, notify,
        }),
        [settings, meta, categories, loadError, cart, count, subtotal, addToBag, setQty, removeLine, clearBag, bagOpen, toast, notify]
    );

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
