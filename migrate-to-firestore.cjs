const admin = require("firebase-admin");
const Database = require("better-sqlite3");
const path = require("path");

// Initialize Firebase Admin (uses local credentials if logged in via CLI)
// Note: In local environment, you might need to point to a service account key
// but often `npx firebase-admin` or similar works if authenticated.
// Alternatively, we use the project ID.

admin.initializeApp({
    projectId: "zema-hukuk"
});

const db_firestore = admin.firestore();
const db_sqlite = new Database("database.db");

async function migrate() {
    console.log("Starting migration to Firestore...");

    // 1. Settings
    const settings = db_sqlite.prepare("SELECT * FROM settings").all();
    for (const s of settings) {
        await db_firestore.collection("settings").doc(s.key).set({ value: s.value });
    }
    console.log(`Migrated ${settings.length} settings.`);

    // 2. Pages
    const pages = db_sqlite.prepare("SELECT * FROM pages").all();
    for (const p of pages) {
        const { id, ...data } = p;
        await db_firestore.collection("pages").doc(String(id)).set(data);
    }
    console.log(`Migrated ${pages.length} pages.`);

    // 3. Sections
    const sections = db_sqlite.prepare("SELECT * FROM sections").all();
    for (const s of sections) {
        const { id, ...data } = s;
        await db_firestore.collection("sections").doc(id).set(data);
    }
    console.log(`Migrated ${sections.length} sections.`);

    // 4. Menus
    const menus = db_sqlite.prepare("SELECT * FROM menus").all();
    for (const m of menus) {
        const { id, ...data } = m;
        await db_firestore.collection("menus").doc(String(id)).set(data);
    }
    console.log(`Migrated ${menus.length} menus.`);

    // 5. Services
    const services = db_sqlite.prepare("SELECT * FROM services").all();
    for (const s of services) {
        const { id, ...data } = s;
        await db_firestore.collection("services").doc(String(id)).set(data);
    }
    console.log(`Migrated ${services.length} services.`);

    // 6. Lawyers
    const lawyers = db_sqlite.prepare("SELECT * FROM lawyers").all();
    for (const l of lawyers) {
        const { id, ...data } = l;
        await db_firestore.collection("lawyers").doc(String(id)).set(data);
    }
    console.log(`Migrated ${lawyers.length} lawyers.`);

    console.log("Migration completed successfully!");
}

migrate().catch(console.error);
