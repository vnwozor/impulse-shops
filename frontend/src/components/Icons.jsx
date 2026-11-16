const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export const IconSearch = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
);
export const IconBag = (p) => (
    <svg viewBox="0 0 24 24" width="19" height="19" {...base} {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const IconMenu = (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...base} {...p}><path d="M3 8h18M3 16h18" /></svg>
);
export const IconClose = (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconArrow = (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="M4 12h15M13 6l6 6-6 6" /></svg>
);
export const IconChevron = (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconPrev = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M15 5l-7 7 7 7" /></svg>
);
export const IconNext = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M9 5l7 7-7 7" /></svg>
);
export const IconPlus = (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconMinus = (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...base} {...p}><path d="M5 12h14" /></svg>
);
export const IconCheck = (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconShield = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6L12 3z" /><path d="M8.6 12.2l2.4 2.4 4.4-4.6" /></svg>
);
export const IconTruck = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" /><circle cx="6.5" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" /></svg>
);
export const IconSparkle = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M12 3c.8 5 2.6 7.6 8 9-5.4 1.4-7.2 4-8 9-.8-5-2.6-7.6-8-9 5.4-1.4 7.2-4 8-9z" /></svg>
);
export const IconGlobe = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5S9.6 5.9 12 3.5z" /></svg>
);
export const IconChat = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M4 5.5h16v10H9l-5 4v-14z" /><path d="M8 10.5h8" /></svg>
);
export const IconWhatsApp = (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
        <path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
);
