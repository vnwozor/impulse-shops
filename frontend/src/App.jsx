import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useStore } from "./context/Store";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BagDrawer from "./components/BagDrawer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Bag from "./pages/Bag";
import Checkout from "./pages/Checkout";
import Order from "./pages/Order";
import Track from "./pages/Track";
import InfoPage from "./pages/InfoPage";
import NotFound from "./pages/NotFound";
import { IconWhatsApp } from "./components/Icons";
import { waLink } from "./lib/api";

export default function App() {
    const { pathname } = useLocation();
    const { settings, loadError, toast } = useStore();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    if (loadError) {
        return (
            <div className="boot boot--error">
                <p className="eyebrow">Impulse.shops</p>
                <p>{loadError}</p>
                <button className="btn btn--ink" onClick={() => window.location.reload()}>Try again</button>
            </div>
        );
    }

    if (!settings) return <div className="boot" aria-busy="true"><span className="boot__mark" /></div>;

    const checkout = pathname.startsWith("/checkout");

    return (
        <>
            <a href="#main" className="skip">Skip to content</a>
            <Header minimal={checkout} />
            <main id="main">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/shop/:category" element={<Shop />} />
                    <Route path="/product/:slug" element={<Product />} />
                    <Route path="/bag" element={<Bag />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order/:number" element={<Order />} />
                    <Route path="/track" element={<Track />} />
                    <Route path="/about" element={<InfoPage page="about" />} />
                    <Route path="/faq" element={<InfoPage page="faq" />} />
                    <Route path="/delivery" element={<InfoPage page="shipping" />} />
                    <Route path="/returns" element={<InfoPage page="returns" />} />
                    <Route path="/authenticity" element={<InfoPage page="authenticity" />} />
                    <Route path="/privacy" element={<InfoPage page="privacy" />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            {!checkout && <Footer />}
            <BagDrawer />

            {!checkout && settings.store.whatsapp && (
                <a className="wa-float" href={waLink(settings.store.whatsapp, "Hi Impulse.shops, I have a question.")} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp">
                    <IconWhatsApp width="22" height="22" />
                </a>
            )}

            <div className={`toast ${toast ? "is-on" : ""}`} role="status" aria-live="polite">{toast}</div>
        </>
    );
}
