import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const ALLOWED = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "image/gif": ".gif" };

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 8 },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED[file.mimetype]) return cb(new Error("Only JPG, PNG, WebP, AVIF or GIF images are allowed"));
        cb(null, true);
    },
});

const cloudinaryReady = () =>
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

let cloudinary;
async function getCloudinary() {
    if (!cloudinary) {
        cloudinary = (await import("cloudinary")).v2;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
    return cloudinary;
}

// returns a public URL for the stored image
export async function storeImage(file, req) {
    // Vercel Blob (set automatically when a Blob store is connected to the project)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { put } = await import("@vercel/blob");
        const name = `products/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ALLOWED[file.mimetype]}`;
        const blob = await put(name, file.buffer, { access: "public", contentType: file.mimetype });
        return blob.url;
    }

    if (cloudinaryReady()) {
        const c = await getCloudinary();
        const result = await new Promise((resolve, reject) => {
            c.uploader
                .upload_stream({ folder: "impulse-shops", resource_type: "image" }, (err, r) => (err ? reject(err) : resolve(r)))
                .end(file.buffer);
        });
        return result.secure_url;
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ALLOWED[file.mimetype]}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
    // relative path: the storefront and admin proxy /uploads to the API in development
    return `/uploads/${name}`;
}
