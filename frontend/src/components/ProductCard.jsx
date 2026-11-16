import { Link } from "react-router-dom";
import { useStore } from "../context/Store";
import { img, money } from "../lib/api";

export default function ProductCard({ product, index }) {
    const { categories } = useStore();
    const second = product.images?.[1];
    const soldOut = product.stock <= 0;
    const onSale = product.compareAt > product.price;
    const category = categories.find((c) => c.slug === product.category)?.name || product.category;

    let tag = "";
    if (soldOut) tag = "Sold out";
    else if (onSale) tag = `−${Math.round((1 - product.price / product.compareAt) * 100)}%`;
    else if (product.stock === 1) tag = "Last one";
    else if (product.isNew) tag = "New";

    return (
        <Link to={`/product/${product.slug}`} className={`card ${second ? "has-alt" : ""} ${soldOut ? "is-sold" : ""}`}>
            <div className="card__media">
                <img src={img(product.images?.[0], 900)} alt={product.name} loading="lazy" className="card__img" />
                {second && <img src={img(second, 900)} alt="" loading="lazy" className="card__img card__img--alt" />}
                {tag && <span className="card__tag">{tag}</span>}
                {index !== undefined && <span className="card__index">{String(index + 1).padStart(2, "0")}</span>}
            </div>
            <div className="card__info">
                <div>
                    <p className="card__name">{product.name}</p>
                    <p className="card__cat">{product.brand || category}</p>
                </div>
                <p className="card__price">
                    {onSale && <s>{money(product.compareAt)}</s>}
                    {money(product.price)}
                </p>
            </div>
        </Link>
    );
}

export function CardSkeleton() {
    return (
        <div className="card card--skeleton" aria-hidden="true">
            <div className="card__media" />
            <div className="card__info"><span /><span /></div>
        </div>
    );
}
