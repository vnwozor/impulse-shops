import { useId, useState } from "react";
import { IconPlus } from "./Icons";

export default function Accordion({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const id = useId();
    return (
        <div className={`acc ${open ? "is-open" : ""}`}>
            <button className="acc__head" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={id}>
                <span>{title}</span>
                <IconPlus className="acc__icon" />
            </button>
            <div className="acc__body" id={id} role="region">
                <div>
                    <div className="acc__inner">{children}</div>
                </div>
            </div>
        </div>
    );
}
