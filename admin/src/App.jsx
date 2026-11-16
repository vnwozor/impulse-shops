import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useAdmin } from "./lib/admin";
import { STORE_URL } from "./lib/api";
import wordmark from "./assets/wordmark.webp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductEdit from "./pages/ProductEdit";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Storefront from "./pages/Storefront";
import Delivery from "./pages/Delivery";
import Payments from "./pages/Payments";
import Content from "./pages/Content";
import StoreDetails from "./pages/StoreDetails";
import { Icon } from "./components/ui";

const NAV = [
    { group: "Overview", items: [["/", "Dashboard", "grid"]] },
    { group: "Sell", items: [["/orders", "Orders", "receipt"], ["/products", "Products", "tag"], ["/categories", "Categories", "folder"], ["/customers", "Customers", "users"]] },
    { group: "Website", items: [["/storefront", "Homepage", "layout"], ["/content", "Pages & FAQ", "file"]] },
    { group: "Settings", items: [["/delivery", "Delivery", "truck"], ["/payments", "Payments", "card"], ["/store", "Store details", "store"]] },
];

export default function App() {
    const { token, settings, signOut } = useAdmin();
    const [menu, setMenu] = useState(false);
    const { pathname } = useLocation();

    useEffect(() => setMenu(false), [pathname]);

    if (!token) return <Login />;
    if (!settings) return <div className="boot"><span className="boot__mark" /></div>;

    return (
        <div className={`shell ${menu ? "menu-open" : ""}`}>
            <aside className="side">
                <div className="side__brand">
                    <img src={wordmark} alt="Impulse.shops" />
                    <span>Admin</span>
                </div>
                <nav className="side__nav">
                    {NAV.map((g) => (
                        <div key={g.group} className="side__group">
                            <p className="side__label">{g.group}</p>
                            {g.items.map(([to, label, icon]) => (
                                <NavLink key={to} to={to} end={to === "/"} className="side__link">
                                    <Icon name={icon} /> {label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="side__foot">
                    <a href={STORE_URL} target="_blank" rel="noreferrer" className="side__link">
                        <Icon name="external" /> View website
                    </a>
                    <button onClick={signOut} className="side__link">
                        <Icon name="logout" /> Sign out
                    </button>
                </div>
            </aside>
            <div className="side__scrim" onClick={() => setMenu(false)} />

            <div className="main">
                <div className="mobilebar">
                    <button onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" /></button>
                    <img src={wordmark} alt="Impulse.shops" />
                    <span />
                </div>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/new" element={<ProductEdit />} />
                    <Route path="/products/:id" element={<ProductEdit />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/storefront" element={<Storefront />} />
                    <Route path="/content" element={<Content />} />
                    <Route path="/delivery" element={<Delivery />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/store" element={<StoreDetails />} />
                    <Route path="*" element={<Dashboard />} />
                </Routes>
            </div>
        </div>
    );
}
