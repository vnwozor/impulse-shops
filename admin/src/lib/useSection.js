import { useEffect, useState } from "react";
import { useAdmin } from "./admin";

// keeps an editable copy of one settings section and saves it back
export function useSection(section) {
    const { settings, saveSection, notify } = useAdmin();
    const [draft, setDraft] = useState(() => structuredClone(settings[section]));
    const [saving, setSaving] = useState(false);

    // only reload the draft when this section itself changed on the server,
    // so saving another section on the same page doesn't wipe edits here
    const saved = JSON.stringify(settings[section]);
    useEffect(() => {
        setDraft(JSON.parse(saved));
    }, [saved]);

    const dirty = JSON.stringify(draft) !== JSON.stringify(settings[section]);

    useEffect(() => {
        if (!dirty) return;
        const warn = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const save = async () => {
        setSaving(true);
        try {
            await saveSection(section, draft);
            notify("Saved. The website is updated.");
        } catch (e) {
            notify(e.message, "error");
        }
        setSaving(false);
    };

    const reset = () => setDraft(structuredClone(settings[section]));
    const set = (path, value) =>
        setDraft((d) => {
            const next = structuredClone(d);
            const keys = path.split(".");
            let o = next;
            keys.slice(0, -1).forEach((k) => (o = o[k]));
            o[keys.at(-1)] = value;
            return next;
        });

    return { draft, setDraft, set, dirty, saving, save, reset };
}
