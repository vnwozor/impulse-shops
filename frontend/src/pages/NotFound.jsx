import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="wrap empty empty--page">
            <p className="eyebrow">404</p>
            <p className="display-l">This page has moved or never existed.</p>
            <Link to="/shop" className="btn btn--ink">Go to the shop</Link>
        </div>
    );
}
