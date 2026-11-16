import { useEffect, useRef, useState } from "react";

// fades a block in the first time it scrolls into view
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
    const ref = useRef();
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || !("IntersectionObserver" in window)) return setShown(true);
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { rootMargin: "0px 0px -8% 0px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <Tag ref={ref} className={`reveal ${shown ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
            {children}
        </Tag>
    );
}
