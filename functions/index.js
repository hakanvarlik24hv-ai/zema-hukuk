const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- Helper Functions ---
const getSettings = async () => {
    const snapshot = await db.collection("settings").get();
    const settings = {};
    snapshot.forEach(doc => {
        settings[doc.id] = doc.data().value;
    });
    return settings;
};

// --- Middleware ---
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.get("Authorization");
    try {
        const passDoc = await db.collection("settings").doc("admin_password").get();
        const expectedPassword = passDoc.exists ? passDoc.data().value : "admin123";

        if (authHeader && authHeader === expectedPassword) {
            next();
        } else {
            res.status(403).json({ error: "Yetkisiz erişim" });
        }
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası" });
    }
};

// --- Routes ---

// Auth
app.post("/api/verify-password", async (req, res) => {
    const { password } = req.body;
    try {
        const passDoc = await db.collection("settings").doc("admin_password").get();
        const expectedPassword = passDoc.exists ? passDoc.data().value : "admin123";

        if (password === expectedPassword) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, error: "Hatalı şifre" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Sunucu hatası" });
    }
});

// Settings
app.get("/api/settings", async (req, res) => {
    const settings = await getSettings();
    res.json(settings);
});

app.post("/api/settings", authMiddleware, async (req, res) => {
    const updates = req.body;
    const batch = db.batch();
    for (const [key, value] of Object.entries(updates)) {
        batch.set(db.collection("settings").doc(key), { value });
    }
    await batch.commit();
    res.json({ success: true });
});

// Pages
app.get("/api/pages", async (req, res) => {
    const snapshot = await db.collection("pages").get();
    const pages = [];
    snapshot.forEach(doc => pages.push({ id: doc.id, ...doc.data() }));
    res.json(pages);
});

app.get("/api/pages/:slug", async (req, res) => {
    const snapshot = await db.collection("pages").where("slug", "==", req.params.slug).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: "Sayı bulunamadı" });
    res.json({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
});

app.post("/api/pages", authMiddleware, async (req, res) => {
    const docRef = await db.collection("pages").add(req.body);
    res.json({ id: docRef.id });
});

app.put("/api/pages/:id", authMiddleware, async (req, res) => {
    await db.collection("pages").doc(req.params.id).set(req.body, { merge: true });
    res.json({ success: true });
});

app.delete("/api/pages/:id", authMiddleware, async (req, res) => {
    await db.collection("pages").doc(req.params.id).delete();
    res.json({ success: true });
});

// Sections
app.get("/api/sections", async (req, res) => {
    const snapshot = await db.collection("sections").get();
    const sections = [];
    snapshot.forEach(doc => sections.push({ id: doc.id, ...doc.data() }));
    res.json(sections);
});

app.put("/api/sections/:id", authMiddleware, async (req, res) => {
    await db.collection("sections").doc(req.params.id).set(req.body, { merge: true });
    res.json({ success: true });
});

// Menus
app.get("/api/menus", async (req, res) => {
    const snapshot = await db.collection("menus").orderBy("sort_order").get();
    const menus = [];
    snapshot.forEach(doc => menus.push({ id: doc.id, ...doc.data() }));
    res.json(menus);
});

app.post("/api/menus", authMiddleware, async (req, res) => {
    const docRef = await db.collection("menus").add(req.body);
    res.json({ id: docRef.id });
});

app.put("/api/menus/:id", authMiddleware, async (req, res) => {
    await db.collection("menus").doc(req.params.id).set(req.body, { merge: true });
    res.json({ success: true });
});

app.delete("/api/menus/:id", authMiddleware, async (req, res) => {
    await db.collection("menus").doc(req.params.id).delete();
    res.json({ success: true });
});

// Services
app.get("/api/services", async (req, res) => {
    const snapshot = await db.collection("services").orderBy("sort_order").get();
    const services = [];
    snapshot.forEach(doc => services.push({ id: doc.id, ...doc.data() }));
    res.json(services);
});

app.post("/api/services", authMiddleware, async (req, res) => {
    const docRef = await db.collection("services").add(req.body);
    res.json({ id: docRef.id });
});

app.put("/api/services/:id", authMiddleware, async (req, res) => {
    await db.collection("services").doc(req.params.id).set(req.body, { merge: true });
    res.json({ success: true });
});

app.delete("/api/services/:id", authMiddleware, async (req, res) => {
    await db.collection("services").doc(req.params.id).delete();
    res.json({ success: true });
});

// Lawyers
app.get("/api/lawyers", async (req, res) => {
    const snapshot = await db.collection("lawyers").orderBy("sort_order").get();
    const lawyers = [];
    snapshot.forEach(doc => lawyers.push({ id: doc.id, ...doc.data() }));
    res.json(lawyers);
});

app.post("/api/lawyers", authMiddleware, async (req, res) => {
    const docRef = await db.collection("lawyers").add(req.body);
    res.json({ id: docRef.id });
});

app.put("/api/lawyers/:id", authMiddleware, async (req, res) => {
    await db.collection("lawyers").doc(req.params.id).set(req.body, { merge: true });
    res.json({ success: true });
});

app.delete("/api/lawyers/:id", authMiddleware, async (req, res) => {
    await db.collection("lawyers").doc(req.params.id).delete();
    res.json({ success: true });
});

// Messages
app.get("/api/messages", authMiddleware, async (req, res) => {
    const snapshot = await db.collection("messages").orderBy("created_at", "desc").get();
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    res.json(messages);
});

app.post("/api/messages", async (req, res) => {
    const payload = {
        ...req.body,
        created_at: new Date().toISOString(),
        is_read: 0
    };
    const docRef = await db.collection("messages").add(payload);
    res.json({ id: docRef.id, success: true });
});

app.put("/api/messages/:id/read", authMiddleware, async (req, res) => {
    await db.collection("messages").doc(req.params.id).set({ is_read: 1 }, { merge: true });
    res.json({ success: true });
});

app.delete("/api/messages/:id", authMiddleware, async (req, res) => {
    await db.collection("messages").doc(req.params.id).delete();
    res.json({ success: true });
});

exports.api = functions.https.onRequest(app);
