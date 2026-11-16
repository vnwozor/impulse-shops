import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const newId = () => crypto.randomBytes(12).toString("hex");

/*
 * Two interchangeable stores with the same small API:
 *   all(collection)  get(collection, id)  insert(collection, doc)
 *   update(collection, id, patch)  put(collection, id, doc)  remove(collection, id)
 *
 * The catalogue of a boutique is small (hundreds of items, not millions),
 * so filtering and sorting happen in the route handlers.
 */

class FileStore {
    constructor(file) {
        this.file = file;
        this.data = {};
        this.queue = Promise.resolve();
    }

    async init() {
        try {
            this.data = JSON.parse(await fs.readFile(this.file, "utf8"));
        } catch {
            this.data = {};
        }
        console.log(`Data: local file ${path.relative(process.cwd(), this.file)}`);
    }

    col(name) {
        if (!this.data[name]) this.data[name] = [];
        return this.data[name];
    }

    persist() {
        // writes are queued so two requests never write the file at the same time
        this.queue = this.queue.then(async () => {
            await fs.mkdir(path.dirname(this.file), { recursive: true });
            const tmp = `${this.file}.tmp`;
            await fs.writeFile(tmp, JSON.stringify(this.data, null, 2));
            await fs.rename(tmp, this.file);
        });
        return this.queue;
    }

    async all(name) {
        return structuredClone(this.col(name));
    }

    async get(name, id) {
        const doc = this.col(name).find((d) => d._id === id);
        return doc ? structuredClone(doc) : null;
    }

    async insert(name, doc) {
        const record = { _id: newId(), ...doc };
        this.col(name).push(record);
        await this.persist();
        return structuredClone(record);
    }

    async update(name, id, patch) {
        const list = this.col(name);
        const i = list.findIndex((d) => d._id === id);
        if (i === -1) return null;
        list[i] = { ...list[i], ...patch, _id: id };
        await this.persist();
        return structuredClone(list[i]);
    }

    async put(name, id, doc) {
        const list = this.col(name);
        const i = list.findIndex((d) => d._id === id);
        const record = { ...doc, _id: id };
        if (i === -1) list.push(record);
        else list[i] = record;
        await this.persist();
        return structuredClone(record);
    }

    async remove(name, id) {
        const list = this.col(name);
        const i = list.findIndex((d) => d._id === id);
        if (i === -1) return false;
        list.splice(i, 1);
        await this.persist();
        return true;
    }

    async clear() {
        this.data = {};
        await this.persist();
    }
}

class MongoStore {
    async init(uri) {
        const { MongoClient } = await import("mongodb");
        this.client = new MongoClient(uri);
        await this.client.connect();
        this.db = this.client.db(process.env.MONGO_DB || "impulse");
        console.log(`Data: MongoDB (${this.db.databaseName})`);
    }

    c(name) {
        return this.db.collection(name);
    }

    all(name) {
        return this.c(name).find({}).toArray();
    }

    get(name, id) {
        return this.c(name).findOne({ _id: id });
    }

    async insert(name, doc) {
        const record = { _id: newId(), ...doc };
        await this.c(name).insertOne(record);
        return record;
    }

    async update(name, id, patch) {
        const { _id, ...rest } = patch;
        return this.c(name).findOneAndUpdate({ _id: id }, { $set: rest }, { returnDocument: "after" });
    }

    async put(name, id, doc) {
        const { _id, ...rest } = doc;
        await this.c(name).replaceOne({ _id: id }, rest, { upsert: true });
        return { ...rest, _id: id };
    }

    async remove(name, id) {
        const res = await this.c(name).deleteOne({ _id: id });
        return res.deletedCount > 0;
    }

    async clear() {
        for (const name of ["products", "categories", "orders", "settings", "subscribers"]) {
            await this.c(name).deleteMany({});
        }
    }
}

// MONGODB_URI is the name the Vercel MongoDB Atlas integration uses
const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI;

// On Vercel the file system is read-only except /tmp, which is wiped often.
// The file store there is only a stand-in until a MongoDB database is connected.
const FILE = process.env.VERCEL ? "/tmp/impulse-db.json" : path.join(__dirname, "..", "data", "db.json");

export const db = MONGO ? new MongoStore() : new FileStore(FILE);
export const usingDatabase = Boolean(MONGO);

export const connect = () => db.init(MONGO);
