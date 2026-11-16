import "dotenv/config";
import { db, connect } from "./db.js";
import { slugify } from "./lib/util.js";

const u = (id, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
    "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
    "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
    "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export const defaultSettings = () => ({
    store: {
        name: "Impulse.shops",
        legalName: "Impulse.shops by Mainroadlife",
        tagline: "Authentic Luxury. Trusted Always.",
        email: "Mainroadlifemarketing@gmail.com",
        phone: "08123378722",
        whatsapp: "2348123378722",
        location: "Lagos, Nigeria",
        instagram: "https://www.instagram.com/impulse.shops",
        tiktok: "https://www.tiktok.com/@impulse.shops",
        facebook: "https://www.facebook.com/impulse.shops",
        currency: "NGN",
    },
    announcement: {
        enabled: true,
        text: "Same-day delivery across Lagos  ·  Nationwide shipping in 2–4 working days",
    },
    hero: {
        interval: 6,
        slides: [
            {
                image: u("photo-1766056278945-069f29d43d15", 2000),
                eyebrow: "New season",
                title: "Authentic luxury,\ntrusted always.",
                ctaLabel: "Shop new arrivals",
                ctaLink: "/shop?sort=new",
            },
            {
                image: u("photo-1788999422645-234da24002af", 2000),
                eyebrow: "Bags & small leather",
                title: "Pieces you keep\nfor a long time.",
                ctaLabel: "Shop bags",
                ctaLink: "/shop/bags",
            },
            {
                image: u("photo-1783368241408-423b24040f00", 2000),
                eyebrow: "Fragrance",
                title: "The finishing\ntouch.",
                ctaLabel: "Shop fragrance",
                ctaLink: "/shop/fragrance",
            },
        ],
    },
    home: {
        newInTitle: "New in",
        bestTitle: "Most wanted",
        editorial: {
            image: u("photo-1775036422790-ebdcede0ebef", 1800),
            eyebrow: "By Mainroadlife",
            title: "Bought right. Checked twice. Delivered to your door.",
            body:
                "Every piece that comes through Impulse.shops is inspected by hand before it is listed. We check stitching, hardware, serials and packaging, and we only sell what we would wear ourselves. If you have a question about a piece, message us and a real person will answer.",
            ctaLabel: "About us",
            ctaLink: "/about",
        },
        concierge: {
            title: "Can't find it here?",
            body: "Tell us the piece, size and colour. We source on request and send you photos before you pay.",
        },
    },
    delivery: {
        freeOver: 1000000,
        pickup: {
            enabled: true,
            label: "Pick up in Lagos",
            note: "We'll send the pickup address and a time on WhatsApp once your order is confirmed.",
        },
        zones: [
            { id: "lagos-mainland", name: "Lagos Mainland", states: ["Lagos"], fee: 3500, eta: "Same day if ordered before 2pm" },
            { id: "lagos-island", name: "Lagos Island, Lekki & Ajah", states: ["Lagos"], fee: 5000, eta: "Same day if ordered before 2pm" },
            { id: "south-west", name: "South West", states: ["Ogun", "Oyo", "Osun", "Ondo", "Ekiti"], fee: 7000, eta: "1–2 working days" },
            { id: "abuja", name: "Abuja", states: ["FCT - Abuja"], fee: 8000, eta: "1–3 working days" },
            { id: "rest", name: "Rest of Nigeria", states: [], fee: 10000, eta: "2–4 working days" },
        ],
    },
    payments: {
        transfer: { enabled: true, bankName: "", accountName: "", accountNumber: "" },
        whatsapp: { enabled: true },
        card: { enabled: true },
    },
    content: {
        about:
            "Impulse.shops is the luxury, fashion and lifestyle arm of Mainroadlife, based in Lagos.\n\nWe started by sourcing pieces for friends who were tired of guessing whether what they bought online was real. That is still the job: find good pieces, check them properly, price them fairly and get them to you quickly.\n\nWe stock bags, watches, eyewear, fragrance, jewellery, footwear and leather goods. Some items are new, some are pre-owned in excellent condition, and each listing says which. If something is not right when it arrives, we make it right.",
        authenticity:
            "Every item is inspected before it is listed: materials, stitching, hardware, date codes or serials, and packaging. Where a piece comes with a receipt, card or dust bag, the listing says so. If an item we sold you is ever shown not to be authentic, we refund you in full.",
        shipping:
            "Lagos orders placed before 2pm are delivered the same day, Monday to Saturday. Orders to other states ship within 24 hours and arrive in 2–4 working days. You will get a WhatsApp message when your order leaves us, with the rider's or courier's details.\n\nDelivery fees are shown at checkout before you pay. Orders above the free-delivery threshold ship free anywhere in Nigeria.",
        returns:
            "You can return an item within 48 hours of delivery if it is unused, with all tags, packaging and accessories. Message us on WhatsApp with your order number to start a return. Once we receive and check the item, we refund you or exchange it, whichever you prefer.\n\nFragrance, earrings and items marked final sale cannot be returned unless they arrive damaged.",
        privacy:
            "We only collect what we need to deliver your order: your name, phone number, email and address. We never sell or share your details with anyone except the rider or courier delivering your order. Card payments are handled by Paystack; we never see or store your card number.",
        faq: [
            { q: "Are your items authentic?", a: "Yes. Every piece is inspected by hand before it is listed, and we refund you in full if an item is ever shown not to be authentic." },
            { q: "How long does delivery take?", a: "Same day within Lagos for orders placed before 2pm. Other states take 2–4 working days." },
            { q: "How do I pay?", a: "Pay by card at checkout, by bank transfer, or place your order and finish payment on WhatsApp with our team." },
            { q: "Can I see the item before paying?", a: "Yes. Message us on WhatsApp and we will send extra photos or a short video of the exact piece." },
            { q: "Do you source items on request?", a: "We do. Send us the piece, size and colour you want and we will come back with availability and a price." },
            { q: "Can I return an item?", a: "Within 48 hours of delivery if it is unused and complete with tags and packaging. See our returns policy for details." },
        ],
    },
});

const categories = [
    { name: "Bags", image: u("photo-1584917865442-de89df76afd3", 1200) },
    { name: "Watches", image: u("photo-1524805444758-089113d48a6d", 1200) },
    { name: "Eyewear", image: u("photo-1611222777277-61319d63ca94", 1200) },
    { name: "Fragrance", image: u("photo-1594035910387-fea47794261f", 1200) },
    { name: "Jewellery", image: u("photo-1611107683227-e9060eccd846", 1200) },
    { name: "Footwear", image: u("photo-1543652711-77eeb35ae548", 1200) },
    { name: "Belts", image: u("photo-1624222247344-550fb60583dc", 1200) },
];

const P = (name, category, price, images, extra = {}) => ({
    name,
    category: slugify(category),
    price,
    compareAt: 0,
    stock: 3,
    options: { label: "", values: [] },
    description: "",
    details: [],
    images: images.map((id) => u(id)),
    featured: false,
    isNew: false,
    condition: "New",
    status: "active",
    ...extra,
});

const products = [
    P("Structured Leather Shoulder Bag", "Bags", 685000, ["photo-1590739225287-bd31519780c3", "photo-1548036328-c9fa89d128fa"], {
        description: "Smooth black calfskin with a firm, structured body and a single adjustable strap. Fits a phone, cardholder, keys and a small fragrance.",
        details: ["Calfskin leather", "Polished gold-tone hardware", "Magnetic closure", "Comes with dust bag"],
        featured: true, isNew: true, stock: 2,
    }),
    P("Crimson Top-Handle Bag", "Bags", 540000, ["photo-1584917865442-de89df76afd3", "photo-1591348278900-019a8a2a8b1d"], {
        description: "A deep red top-handle bag in grained leather. Carry it by hand or on the detachable strap.",
        details: ["Grained leather", "Detachable strap", "Interior zip pocket", "Comes with dust bag"],
        featured: true, compareAt: 610000,
    }),
    P("Slate Crossbody", "Bags", 395000, ["photo-1559563458-527698bf5295"], {
        description: "Soft grey leather crossbody with a wide strap. Light, easy and goes with everything.",
        details: ["Pebbled leather", "Adjustable strap", "Zip top"],
        isNew: true,
    }),
    P("Heritage Chronograph, Tan Strap", "Watches", 1250000, ["photo-1524805444758-089113d48a6d"], {
        description: "Steel chronograph with a clean white dial and a tan leather strap that softens with wear.",
        details: ["42mm steel case", "Sapphire crystal", "Chronograph function", "Water resistant to 100m", "Box and papers"],
        featured: true, stock: 1,
    }),
    P("Two-Tone Chronograph", "Watches", 1480000, ["photo-1587925358603-c2eea5305bbc"], {
        description: "Steel and gold-tone bracelet with a sunburst dial. Dressy enough for an evening, solid enough for every day.",
        details: ["41mm case", "Two-tone bracelet", "Date window", "Box and papers"],
        isNew: true, stock: 1,
    }),
    P("Steel Dress Watch", "Watches", 920000, ["photo-1620625515032-6ed0c1790c75", "photo-1600003014755-ba31aa59c4b6"], {
        description: "A slim steel dress watch with a white dial and baton markers. Sits flat under a shirt cuff.",
        details: ["38mm steel case", "Automatic movement", "Exhibition caseback"],
    }),
    P("Gold Shield Sunglasses", "Eyewear", 210000, ["photo-1643110279326-6ff17149856a"], {
        description: "Gold metal frame with black lenses. Full UV protection.",
        details: ["Metal frame", "UV400 lenses", "Hard case and cloth included"],
        featured: true, isNew: true,
    }),
    P("Gradient Aviators", "Eyewear", 165000, ["photo-1589642380614-4a8c2147b857"], {
        description: "Classic aviator shape in a thin gold-tone frame with gradient lenses.",
        details: ["Metal frame", "Gradient UV400 lenses", "Hard case included"],
    }),
    P("Black Square Frames", "Eyewear", 145000, ["photo-1611222777277-61319d63ca94"], {
        description: "Thick black acetate frames with dark lenses. Bold without trying too hard.",
        details: ["Acetate frame", "UV400 lenses", "Case included"],
    }),
    P("Noir Oud Eau de Parfum, 100ml", "Fragrance", 185000, ["photo-1594035910387-fea47794261f"], {
        description: "Warm oud, leather and a little rose. Lasts all day and is noticed when you leave the room.",
        details: ["100ml eau de parfum", "Sealed box"],
        featured: true, stock: 6,
    }),
    P("Amber Extrait, 50ml", "Fragrance", 240000, ["photo-1585218334450-afcf929da36e"], {
        description: "Rich amber and vanilla with a dry woody base. A small bottle that goes a long way.",
        details: ["50ml extrait de parfum", "Sealed box"],
        isNew: true, stock: 4,
    }),
    P("Clear Glass Eau de Toilette, 100ml", "Fragrance", 160000, ["photo-1761659760494-32b921a2449f"], {
        description: "Fresh citrus and clean musk. Easy to wear in Lagos heat.",
        details: ["100ml eau de toilette", "Sealed box"],
        stock: 5,
    }),
    P("Cuban Link Chain", "Jewellery", 320000, ["photo-1611107683227-e9060eccd846"], {
        description: "Heavy Cuban link chain with a secure box clasp.",
        details: ["18k gold plated stainless steel", "Box clasp", "Tarnish resistant"],
        options: { label: "Length", values: ["50cm", "55cm", "60cm"] },
        featured: true,
    }),
    P("Twin Chain Bracelets", "Jewellery", 145000, ["photo-1708220040856-131e4f86a1aa"], {
        description: "Two fine gold chain bracelets, sold as a pair. Wear them together or apart.",
        details: ["18k gold plated", "Lobster clasp", "Gift box included"],
        isNew: true,
    }),
    P("High-Top Leather Sneakers", "Footwear", 455000, ["photo-1543652711-77eeb35ae548"], {
        description: "White and black leather high-tops with a cushioned sole. Clean and comfortable all day.",
        details: ["Full-grain leather upper", "Rubber cupsole", "Comes with box and spare laces"],
        options: { label: "Size (EU)", values: ["40", "41", "42", "43", "44", "45"] },
        featured: true, stock: 6,
    }),
    P("Silver Buckle Leather Belt", "Belts", 130000, ["photo-1624222247344-550fb60583dc"], {
        description: "Brown leather belt with a polished silver buckle. Works with jeans or tailoring.",
        details: ["Full-grain leather", "Polished silver buckle", "3.5cm width"],
        options: { label: "Size (cm)", values: ["85", "90", "95", "100", "105"] },
        stock: 5,
    }),
    P("Black Calfskin Belt", "Belts", 115000, ["photo-1664286074176-5206ee5dc878"], {
        description: "Plain black calfskin belt. The one you reach for every time.",
        details: ["Calfskin leather", "3cm width"],
        options: { label: "Size (cm)", values: ["85", "90", "95", "100", "105"] },
        stock: 0,
    }),
];

// remove copies with the same slug (keeps the oldest). Slugs are unique by design,
// so this only ever removes duplicates created by two servers seeding at once.
async function removeDuplicates(name) {
    const seen = new Set();
    const list = (await db.all(name)).sort((a, b) => String(a.createdAt || a._id).localeCompare(String(b.createdAt || b._id)));
    for (const doc of list) {
        if (seen.has(doc.slug)) await db.remove(name, doc._id);
        else seen.add(doc.slug);
    }
}

export async function seedIfEmpty({ reset = false } = {}) {
    if (reset) await db.clear();

    // only one server instance gets to load the samples, even if several start together
    const first = await db.claim("meta", "seeded");
    if (!first) return removeDuplicates("categories").then(() => removeDuplicates("products"));

    // also cleans up databases seeded before this lock existed
    await removeDuplicates("categories");
    await removeDuplicates("products");

    const existing = await db.get("settings", "site");
    if (!existing) await db.put("settings", "site", defaultSettings());

    if ((await db.all("categories")).length === 0) {
        for (const [i, c] of categories.entries()) {
            await db.insert("categories", { ...c, slug: slugify(c.name), order: i });
        }
    }

    if ((await db.all("products")).length === 0) {
        const now = Date.now();
        for (const [i, p] of products.entries()) {
            const createdAt = new Date(now - i * 36e5 * 7).toISOString();
            await db.insert("products", { ...p, slug: slugify(p.name), sold: 0, createdAt, updatedAt: createdAt });
        }
        console.log(`Seeded ${products.length} sample products`);
    }
}

// `npm run seed:reset` wipes the data and loads the samples again
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
    await connect();
    await seedIfEmpty({ reset: process.argv.includes("--reset") });
    console.log("Done");
    process.exit(0);
}
