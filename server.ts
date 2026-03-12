import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getBytes } from 'firebase/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Proje ID:', firebaseConfig.projectId);

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
// Node.js ortamında daha kararlı çalışması için long polling zorlanıyor
const db_cloud = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_FIREBASE_API_KEY || '');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors()); // Temporarily allow all for testing
app.options('*', cors());
app.use(express.json());

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});


const db = new Database('database.db');

// Server Alive Check
app.get('/', (req, res) => {
    res.send('ZEMA Hukuk API Sunucusu Çalışıyor (Port 3001)');
});

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    bg_image TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    path TEXT NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(parent_id) REFERENCES menus(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lawyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    image_url TEXT,
    linkedin_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' -- pending, confirmed, cancelled, completed
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    title TEXT NOT NULL,
    case_number TEXT,
    court TEXT,
    status TEXT DEFAULT 'Aktif',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id)
  );

`);

// Seed default sections if empty
const sectionsCount = (db.prepare('SELECT COUNT(*) as count FROM sections').get() as any).count;
if (sectionsCount === 0) {
    const defaultSections = [
        {
            id: 'about',
            title: 'Hukukun Gücüyle Geleceği İnşa Ediyoruz',
            subtitle: 'BİZ KİMİZ?',
            content: 'Zema Hukuk Bürosu, kurulduğu günden bu yana müvekkillerine en üst düzeyde hukuki danışmanlık ve avukatlık hizmeti sunmayı amaçlamaktadır. Deneyimli kadromuzla, hukukun her alanında çözüm odaklı ve etik değerlere bağlı kalarak çalışıyoruz.\n\nMüvekkillerimizin haklarını korumak ve adaletin tecellisine katkıda bulunmak en temel önceliğimizdir. Şeffaflık, dürüstlük ve profesyonellik ilkelerimizden ödün vermeden yolumuza devam ediyoruz.',
            image_url: 'https://picsum.photos/seed/justice-law/800/1000'
        }
    ];

    const insertSection = db.prepare('INSERT INTO sections (id, title, subtitle, content, image_url) VALUES (?, ?, ?, ?, ?)');
    defaultSections.forEach(s => insertSection.run(s.id, s.title, s.subtitle, s.content, s.image_url));
}

// Seed default services if empty
const servicesCount = (db.prepare('SELECT COUNT(*) as count FROM services').get() as any).count;
if (servicesCount === 0) {
    const defaultServices = [
        { title: 'CEZA HUKUKU', icon: 'Gavel', description: 'Soruşturma ve kovuşturma aşamalarında müvekkillerimizin haklarını titizlikle savunuyoruz.' },
        { title: 'TİCARET HUKUKU', icon: 'Briefcase', description: 'Şirketler hukuku, sözleşmeler ve ticari uyuşmazlıklarda profesyonel destek sağlıyoruz.' },
        { title: 'AİLE HUKUKU', icon: 'Users', description: 'Boşanma, velayet ve miras gibi hassas konularda çözüm odaklı yaklaşımlar sunuyoruz.' },
        { title: 'İŞ HUKUKU', icon: 'Scale', description: 'İşçi ve işveren haklarının korunması, iş sözleşmeleri ve tazminat davalarında uzmanız.' },
        { title: 'GAYRİMENKUL HUKUKU', icon: 'BookOpen', description: 'Tapu iptal, tescil ve gayrimenkul satış süreçlerinde hukuki danışmanlık veriyoruz.' },
        { title: 'BİLİŞİM HUKUKU', icon: 'Shield', description: 'Dijital dünyadaki haklarınızın korunması ve siber suçlarla mücadelede yanınızdayız.' },
    ];

    const insertService = db.prepare('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)');
    defaultServices.forEach((s, i) => insertService.run(s.title, s.description, s.icon, i));
}

// Seed default lawyers if empty
const lawyersCount = (db.prepare('SELECT COUNT(*) as count FROM lawyers').get() as any).count;
if (lawyersCount === 0) {
    const defaultLawyers = [
        { name: 'Av. Mehmet Zema', title: 'Kurucu Ortak', bio: '20 yılı aşkın tecrübesiyle ceza hukuku ve borçlar hukuku alanlarında uzmanlaşmıştır.', image_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a' }
    ];

    const insertLawyer = db.prepare('INSERT INTO lawyers (name, title, bio, image_url, sort_order) VALUES (?, ?, ?, ?, ?)');
    defaultLawyers.forEach((l, i) => insertLawyer.run(l.name, l.title, l.bio, l.image_url, i));
}

// Seed default menu if empty
const menusCount = (db.prepare('SELECT COUNT(*) as count FROM menus').get() as any).count;
if (menusCount === 0) {
    const defaultMenus = [
        { title: 'ANA SAYFA', path: '/', sort_order: 1 },
        { title: 'HAKKIMIZDA', path: '/#hakkimizda', sort_order: 2 },
        { title: 'HİZMETLERİMİZ', path: '/#hizmetlerimiz', sort_order: 3 },
        { title: 'EYLEM PLANI', path: '/#avukatlarimiz', sort_order: 4 },
        { title: 'İLETİŞİM', path: '/#iletisim', sort_order: 5 }
    ];

    const insertMenu = db.prepare('INSERT INTO menus (title, path, sort_order) VALUES (?, ?, ?)');
    defaultMenus.forEach(m => insertMenu.run(m.title, m.path, m.sort_order));
}

// Seed default settings or ensure keys exist
const ensureKeys = [
    { key: 'site_name', value: 'ZEMA HUKUK BÜROSU' },
    { key: 'site_logo', value: 'https://i.hizliresim.com/gj3qd7x.png' },
    { key: 'contact_address', value: 'Bahçelievler Mah. Adalet Cad. No: 11 - 20/1 / İstanbul' },
    { key: 'contact_phone', value: '+90 (212) 300 35 66' },
    { key: 'contact_email', value: 'bilgi@zemahukuk.com' },
    { key: 'social_instagram', value: '#' },
    { key: 'social_facebook', value: '#' },
    { key: 'social_twitter', value: '#' },
    { key: 'site_bg_image', value: 'https://i.ibb.co/Y7XzXKd2/arkaplan11.png' },
    { key: 'services_bg_image', value: '' },
    { key: 'team_bg_image', value: '' },
    { key: 'contact_bg_image', value: '' },
    { key: 'contact_map_html', value: '' },
    { key: 'admin_password', value: 'admin123' },
    // SEO Keys
    { key: 'seo_title', value: 'Zema Hukuk & Arabuluculuk | İstanbul Hukuk Bürosu' },
    { key: 'seo_description', value: 'Zema Hukuk, İstanbulda uzman avukat kadrosuyla aile hukuku, ceza hukuku, miras hukuku ve şirketler hukuku alanlarında profesyonel danışmanlık hizmeti sunmaktadır.' },
    { key: 'seo_keywords', value: 'istanbul hukuk bürosu, uzman avukat, boşanma avukatı, ceza avukatı, hukuk danışmanlığı, zema hukuk, arabuluculuk' },
    { key: 'seo_author', value: 'Zema Hukuk' },
    { key: 'seo_favicon', value: 'https://i.hizliresim.com/gj3qd7x.png' },
    { key: 'seo_og_image', value: 'https://i.ibb.co/Y7XzXKd2/arkaplan11.png' },
    { key: 'google_analytics_id', value: 'G-QLTVSG3N79' },
    { key: 'robots_txt', value: 'User-agent: *\nAllow: /' },
    { key: 'seo_google_verification', value: '' },
    { key: 'seo_schema', value: '' }
];

const insertIfMissing = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
ensureKeys.forEach(s => insertIfMissing.run(s.key, s.value));

// Migration: Ensure SEO columns exist in pages table if update failed or table already exists
try {
    db.exec("ALTER TABLE pages ADD COLUMN meta_title TEXT;");
    db.exec("ALTER TABLE pages ADD COLUMN meta_description TEXT;");
    db.exec("ALTER TABLE pages ADD COLUMN meta_keywords TEXT;");
} catch (e) {
    // Columns likely already exist
}

// Routes
app.get('/robots.txt', (req, res) => {
    try {
        const robots = db.prepare("SELECT value FROM settings WHERE key = 'robots_txt'").get() as any;
        res.type('text/plain');
        res.send(robots?.value || 'User-agent: *\nAllow: /');
    } catch (err) {
        res.send('User-agent: *\nAllow: /');
    }
});

app.get('/sitemap.xml', (req, res) => {
    try {
        const pages = db.prepare("SELECT slug FROM pages WHERE is_active = 1").all() as any[];
        const baseUrl = 'https://zema-hukuk.web.app';
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Add home page
        sitemap += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

        // Add dynamic pages
        pages.forEach(p => {
            sitemap += `  <url>\n    <loc>${baseUrl}/p/${p.slug}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });

        sitemap += `</urlset>`;
        res.type('application/xml');
        res.send(sitemap);
    } catch (err) {
        res.status(500).send('Error generating sitemap');
    }
});

app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
        // SECURITY: Never send admin_password to the client
        if (curr.key !== 'admin_password') {
            acc[curr.key] = curr.value;
        }
        return acc;
    }, {});
    res.json(settingsMap);
});

// Middleware to verify admin password for sensitive operations
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Check both standard 'authorization' and any capitalized variants
    const authHeader = req.headers.authorization || req.get('Authorization');

    try {
        const adminSetting = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as any;
        const expectedPassword = adminSetting?.value;

        if (authHeader && expectedPassword && authHeader === expectedPassword) {
            next();
        } else {
            res.status(403).json({ error: 'Yetkisiz erişim: Lütfen tekrar giriş yapın.' });
        }
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

const loginAttempts: Record<string, { count: number, lastAttempt: number }> = {};

app.post('/api/verify-password', (req, res) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    // Clean up old attempts (older than 10 mins)
    if (loginAttempts[ip] && now - loginAttempts[ip].lastAttempt > 600000) {
        delete loginAttempts[ip];
    }

    if (loginAttempts[ip] && loginAttempts[ip].count >= 5) {
        return res.status(429).json({ success: false, error: 'Çok fazla deneme yaptınız. 10 dakika sonra tekrar deneyin.' });
    }

    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, error: 'Şifre gereklidir' });
        }

        const adminPassword = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as any;

        if (adminPassword && password === adminPassword.value) {
            delete loginAttempts[ip];
            res.json({ success: true });
        } else {
            loginAttempts[ip] = {
                count: (loginAttempts[ip]?.count || 0) + 1,
                lastAttempt: now
            };
            res.status(401).json({ success: false, error: 'Hatalı şifre' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

app.post('/api/settings', authMiddleware, (req, res) => {
    const updates = req.body;
    const updateSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    const transaction = db.transaction((settings: any) => {
        for (const [key, value] of Object.entries(settings)) {
            updateSetting.run(key, value);
        }
    });

    transaction(updates);
    res.json({ success: true });
});

app.get('/api/pages', (req, res) => {
    const pages = db.prepare('SELECT * FROM pages WHERE is_active = 1').all();
    res.json(pages);
});

app.get('/api/pages/:slug', (req, res) => {
    const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
    if (page) {
        res.json(page);
    } else {
        res.status(404).json({ error: 'Page not found' });
    }
});

app.post('/api/pages', authMiddleware, (req, res) => {
    const { title, slug, content, bg_image, meta_title, meta_description, meta_keywords } = req.body;
    try {
        const info = db.prepare('INSERT INTO pages (title, slug, content, bg_image, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?, ?)').run(title, slug, content, bg_image || '', meta_title || '', meta_description || '', meta_keywords || '');
        res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/pages/:id', authMiddleware, (req, res) => {
    const { title, slug, content, bg_image, is_active, meta_title, meta_description, meta_keywords } = req.body;
    try {
        db.prepare('UPDATE pages SET title = ?, slug = ?, content = ?, bg_image = ?, is_active = ?, meta_title = ?, meta_description = ?, meta_keywords = ? WHERE id = ?').run(title, slug, content, bg_image || '', is_active, meta_title || '', meta_description || '', meta_keywords || '', req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/pages/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Sections
app.get('/api/sections', (req, res) => {
    const sections = db.prepare('SELECT * FROM sections').all();
    res.json(sections);
});

app.put('/api/sections/:id', authMiddleware, (req, res) => {
    const { title, subtitle, content, image_url } = req.body;
    try {
        db.prepare('UPDATE sections SET title = ?, subtitle = ?, content = ?, image_url = ? WHERE id = ?').run(title, subtitle, content, image_url, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Menus
app.get('/api/menus', (req, res) => {
    const menus = db.prepare('SELECT * FROM menus ORDER BY sort_order').all();
    res.json(menus);
});

app.post('/api/menus', authMiddleware, (req, res) => {
    const { title, path, parent_id, sort_order } = req.body;
    try {
        const info = db.prepare('INSERT INTO menus (title, path, parent_id, sort_order) VALUES (?, ?, ?, ?)').run(title, path, parent_id || null, sort_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/menus/:id', authMiddleware, (req, res) => {
    const { title, path, parent_id, sort_order } = req.body;
    try {
        db.prepare('UPDATE menus SET title = ?, path = ?, parent_id = ?, sort_order = ? WHERE id = ?').run(title, path, parent_id || null, sort_order || 0, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/menus/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM menus WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Services
app.get('/api/services', (req, res) => {
    const services = db.prepare('SELECT * FROM services ORDER BY sort_order').all();
    res.json(services);
});

app.post('/api/services', authMiddleware, (req, res) => {
    const { title, description, icon, sort_order } = req.body;
    try {
        const info = db.prepare('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)').run(title, description, icon, sort_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/services/:id', authMiddleware, (req, res) => {
    const { title, description, icon, sort_order } = req.body;
    try {
        db.prepare('UPDATE services SET title = ?, description = ?, icon = ?, sort_order = ? WHERE id = ?').run(title, description, icon, sort_order, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/services/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Lawyers
app.get('/api/lawyers', (req, res) => {
    const lawyers = db.prepare('SELECT * FROM lawyers ORDER BY sort_order').all();
    res.json(lawyers);
});

app.post('/api/lawyers', authMiddleware, (req, res) => {
    const { name, title, bio, image_url, linkedin_url, instagram_url, facebook_url, sort_order } = req.body;
    try {
        const info = db.prepare('INSERT INTO lawyers (name, title, bio, image_url, linkedin_url, instagram_url, facebook_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(name, title, bio, image_url, linkedin_url || '', instagram_url || '', facebook_url || '', sort_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/lawyers/:id', authMiddleware, (req, res) => {
    const { name, title, bio, image_url, linkedin_url, instagram_url, facebook_url, sort_order } = req.body;
    try {
        db.prepare('UPDATE lawyers SET name = ?, title = ?, bio = ?, image_url = ?, linkedin_url = ?, instagram_url = ?, facebook_url = ?, sort_order = ? WHERE id = ?').run(name, title, bio, image_url, linkedin_url || '', instagram_url || '', facebook_url || '', sort_order, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/lawyers/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM lawyers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Messages
app.get('/api/messages', authMiddleware, (req, res) => {
    const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    res.json(messages);
});

// Get booked slots for frontend
app.get('/api/appointments/booked', (req, res) => {
    try {
        const booked = db.prepare("SELECT date, time FROM appointments WHERE status != 'cancelled'").all();
        res.json(booked);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/appointments', async (req, res) => {
    const { name, phone, date, time, note } = req.body;

    if (!name || !phone || !date || !time) {
        return res.status(400).json({ error: 'Eksik bilgi' });
    }

    try {
        // Check if already booked
        const existing = db.prepare('SELECT id FROM appointments WHERE date = ? AND time = ? AND status != ?').get(date, time, 'cancelled');
        if (existing) {
            return res.status(400).json({ error: 'Bu tarih ve saat zaten dolu.' });
        }

        const info = db.prepare('INSERT INTO appointments (name, phone, date, time, note) VALUES (?, ?, ?, ?, ?)').run(name, phone, date, time, note || '');

        // Send immediate response to user
        res.json({ id: info.lastInsertRowid, success: true });

        // --- Keep Firestore in Sync (Background) ---
        // Using setImmediate to ensure the response is sent first and sync doesn't block
        setImmediate(async () => {
            try {
                console.log(`Syncing appointment ${info.lastInsertRowid} to Firestore...`);
                // Use a proper path and ensure all fields are valid
                const appointmentRef = doc(db_cloud, 'appointments', `temp_${info.lastInsertRowid}_${Date.now()}`);
                await setDoc(appointmentRef, {
                    name: String(name || ''),
                    phone: String(phone || ''),
                    date: String(date || ''),
                    time: String(time || ''),
                    note: String(note || 'Online Randevu Sistemi üzerinden alındı.'),
                    status: 'pending',
                    is_viewed_by_admin: false,
                    created_at: new Date().toISOString()
                });
                console.log(`Firestore sync successful for ${info.lastInsertRowid}`);
            } catch (firestoreErr) {
                console.error('Firestore sync background failed:', firestoreErr);
            }
        });
    } catch (err: any) {
        console.error('Appointment API Error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/messages/:id/read', authMiddleware, (req, res) => {
    try {
        db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/messages/:id', authMiddleware, (req, res) => {
    try {
        db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// Appointments
app.get('/api/appointments', authMiddleware, (req, res) => {
    try {
        const appointments = db.prepare('SELECT * FROM appointments ORDER BY date ASC, time ASC').all();
        res.json(appointments);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});


app.patch('/api/appointments/:id/status', authMiddleware, (req, res) => {
    const { status } = req.body;
    try {
        db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/appointments/:id', authMiddleware, (req, res) => {
    try {
        db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});


// --- Clients ---
app.get('/api/clients', (req, res) => {
    try {
        const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
        res.json(clients);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', async (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || (!email && !phone)) {
        return res.status(400).json({ error: 'Eksik bilgi: İsim ve (email veya telefon) zorunludur.' });
    }

    try {
        const info = db.prepare('INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)').run(name, email || '', phone || '');

        // Sync to Firebase
        setImmediate(async () => {
            try {
                const clientRef = doc(db_cloud, 'clients', String(info.lastInsertRowid));
                await setDoc(clientRef, {
                    name,
                    email: email || '',
                    phone: phone || '',
                    created_at: new Date().toISOString()
                });
            } catch (firestoreErr) { }
        });

        res.json({ id: info.lastInsertRowid, success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/clients/:id', authMiddleware, (req, res) => {
    const { name, email, phone } = req.body;
    try {
        db.prepare('UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?').run(name, email || '', phone || '', req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/clients/:id', authMiddleware, (req, res) => {
    try {
        db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});


// --- Cases ---
app.get('/api/cases', (req, res) => {
    try {
        const cases = db.prepare(`
            SELECT cases.*, clients.name as client_name 
            FROM cases 
            LEFT JOIN clients ON cases.client_id = clients.id 
            ORDER BY cases.created_at DESC
        `).all();
        res.json(cases);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/cases', async (req, res) => {
    const { client_id, title, case_number, court, status, description } = req.body;
    if (!title || !client_id) {
        return res.status(400).json({ error: 'Eksik bilgi: Başlık ve müvekkil seçimi zorunludur.' });
    }

    try {
        const info = db.prepare('INSERT INTO cases (client_id, title, case_number, court, status, description) VALUES (?, ?, ?, ?, ?, ?)').run(
            client_id, title, case_number || '', court || '', status || 'Aktif', description || ''
        );
        res.json({ id: info.lastInsertRowid, success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// --- Cloud Backup & Restore ---

// Export all data
app.get('/api/backup/export', authMiddleware, (req, res) => {
    try {
        const data = {
            settings: db.prepare('SELECT * FROM settings').all(),
            pages: db.prepare('SELECT * FROM pages').all(),
            sections: db.prepare('SELECT * FROM sections').all(),
            menus: db.prepare('SELECT * FROM menus').all(),
            services: db.prepare('SELECT * FROM services').all(),
            lawyers: db.prepare('SELECT * FROM lawyers').all(),
            messages: db.prepare('SELECT * FROM messages').all(),
            appointments: db.prepare('SELECT * FROM appointments').all(),
            clients: db.prepare('SELECT * FROM clients').all(),
            cases: db.prepare('SELECT * FROM cases').all(),
            export_date: new Date().toISOString(),
            version: '1.0'

        };
        res.json(data);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Veri dışa aktarılırken hata oluştu.' });
    }
});

// Import all data
app.post('/api/backup/import', authMiddleware, (req, res) => {
    const data = req.body;

    if (!data || !data.settings || !Array.isArray(data.settings)) {
        return res.status(400).json({ error: 'Geçersiz yedek dosyası formatı.' });
    }

    const transaction = db.transaction(() => {
        // Clear current data
        db.prepare('DELETE FROM settings').run();
        db.prepare('DELETE FROM pages').run();
        db.prepare('DELETE FROM sections').run();
        db.prepare('DELETE FROM menus').run();
        db.prepare('DELETE FROM services').run();
        db.prepare('DELETE FROM lawyers').run();
        db.prepare('DELETE FROM messages').run();
        db.prepare('DELETE FROM appointments').run();
        db.prepare('DELETE FROM clients').run();

        // Re-insert settings (key, value)

        const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        data.settings.forEach((s: any) => insertSetting.run(s.key, s.value));

        // Re-insert pages
        if (data.pages && Array.isArray(data.pages)) {
            const insertPage = db.prepare('INSERT INTO pages (id, title, slug, content, bg_image, is_active, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            data.pages.forEach((p: any) => insertPage.run(p.id, p.title, p.slug, p.content, p.bg_image || '', p.is_active || 1, p.meta_title || '', p.meta_description || '', p.meta_keywords || ''));
        }

        // Re-insert sections
        if (data.sections && Array.isArray(data.sections)) {
            const insertSection = db.prepare('INSERT INTO sections (id, title, subtitle, content, image_url) VALUES (?, ?, ?, ?, ?)');
            data.sections.forEach((s: any) => insertSection.run(s.id, s.title, s.subtitle, s.content, s.image_url));
        }

        // Re-insert menus
        if (data.menus && Array.isArray(data.menus)) {
            const insertMenu = db.prepare('INSERT INTO menus (id, title, path, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)');
            data.menus.forEach((m: any) => insertMenu.run(m.id, m.title, m.path, m.parent_id, m.sort_order));
        }

        // Re-insert services
        if (data.services && Array.isArray(data.services)) {
            const insertService = db.prepare('INSERT INTO services (id, title, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
            data.services.forEach((s: any) => insertService.run(s.id, s.title, s.description, s.icon, s.sort_order));
        }

        // Re-insert lawyers
        if (data.lawyers && Array.isArray(data.lawyers)) {
            const insertLawyer = db.prepare('INSERT INTO lawyers (id, name, title, bio, image_url, linkedin_url, instagram_url, facebook_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            data.lawyers.forEach((l: any) => insertLawyer.run(l.id, l.name, l.title, l.bio, l.image_url, l.linkedin_url || '', l.instagram_url || '', l.facebook_url || '', l.sort_order));
        }

        // Re-insert messages
        if (data.messages && Array.isArray(data.messages)) {
            const insertMessage = db.prepare('INSERT INTO messages (id, name, email, message, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?)');
            data.messages.forEach((m: any) => insertMessage.run(m.id, m.name, m.email, m.message, m.created_at, m.is_read || 0));
        }

        // Re-insert appointments
        if (data.appointments && Array.isArray(data.appointments)) {
            const insertAppointment = db.prepare('INSERT INTO appointments (id, name, phone, date, time, note, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            data.appointments.forEach((a: any) => insertAppointment.run(a.id, a.name, a.phone, a.date, a.time, a.note, a.created_at, a.status || 'pending'));
        }

        // Re-insert clients
        if (data.clients && Array.isArray(data.clients)) {
            const insertClient = db.prepare('INSERT INTO clients (id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)');
            data.clients.forEach((c: any) => insertClient.run(c.id, c.name, c.email, c.phone, c.created_at));
        }
    });


    try {
        transaction();
        res.json({ success: true, message: 'Veriler başarıyla geri yüklendi.' });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Veriler geri yüklenirken hata oluştu.' });
    }
});

// Direct Server-side Save (Cloud Save to Firebase)
app.post('/api/backup/direct-save', authMiddleware, async (req, res) => {
    try {
        const data = {
            settings: db.prepare('SELECT * FROM settings').all(),
            pages: db.prepare('SELECT * FROM pages').all(),
            sections: db.prepare('SELECT * FROM sections').all(),
            menus: db.prepare('SELECT * FROM menus').all(),
            services: db.prepare('SELECT * FROM services').all(),
            lawyers: db.prepare('SELECT * FROM lawyers').all(),
            messages: db.prepare('SELECT * FROM messages').all(),
            appointments: db.prepare('SELECT * FROM appointments').all(),
            clients: db.prepare('SELECT * FROM clients').all(),
            export_date: new Date().toISOString(),
            version: '1.5'

        };

        console.log('Bulut yedekleme (Firestore) başlatılıyor...');
        const backupRef = doc(db_cloud, 'site_management', 'latest_backup');

        await setDoc(backupRef, {
            data: JSON.stringify(data),
            updated_at: new Date().toISOString()
        });

        console.log('Bulut yedekleme Firestore üzerine başarıyla tamamlandı.');

        res.json({ success: true, message: 'Veriler Firestore Bulut Veritabanına başarıyla yedeklendi.' });
    } catch (error) {
        console.error('Cloud save error:', error);
        res.status(500).json({ error: `Veri buluta kaydedilirken hata oluştu: ${error instanceof Error ? error.message : String(error)}` });
    }
});

// Direct Server-side Restore (Cloud Restore from Firebase)
app.post('/api/backup/direct-restore', authMiddleware, async (req, res) => {
    try {
        console.log('Bulut geri yükleme (Firestore) başlatılıyor...');
        const backupRef = doc(db_cloud, 'site_management', 'latest_backup');
        const docSnap = await getDoc(backupRef);

        if (!docSnap.exists()) {
            return res.status(404).json({ error: 'Henüz bir bulut yedeği bulunamadı.' });
        }

        const cloudData = docSnap.data();
        const data = JSON.parse(cloudData.data);
        console.log('Yedek verisi Firestore üzerinden alındı ve ayrıştırıldı.');

        const transaction = db.transaction(() => {
            console.log('Eski veriler temizleniyor...');
            db.prepare('DELETE FROM settings').run();
            db.prepare('DELETE FROM pages').run();
            db.prepare('DELETE FROM sections').run();
            db.prepare('DELETE FROM menus').run();
            db.prepare('DELETE FROM services').run();
            db.prepare('DELETE FROM lawyers').run();
            db.prepare('DELETE FROM messages').run();
            db.prepare('DELETE FROM appointments').run();
            db.prepare('DELETE FROM clients').run();

            if (data.settings && Array.isArray(data.settings)) {
                console.log(`${data.settings.length} adet ayar yüklenecek.`);
                const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
                data.settings.forEach((s: any) => insertSetting.run(s.key, s.value));
            }

            if (data.pages && Array.isArray(data.pages)) {
                console.log(`${data.pages.length} adet sayfa yüklenecek.`);
                const insertPage = db.prepare('INSERT INTO pages (id, title, slug, content, bg_image, is_active, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                data.pages.forEach((p: any) => insertPage.run(p.id, p.title, p.slug, p.content, p.bg_image || '', p.is_active || 1, p.meta_title || '', p.meta_description || '', p.meta_keywords || ''));
            }

            if (data.sections && Array.isArray(data.sections)) {
                console.log(`${data.sections.length} adet bölüm yüklenecek.`);
                const insertSection = db.prepare('INSERT INTO sections (id, title, subtitle, content, image_url) VALUES (?, ?, ?, ?, ?)');
                data.sections.forEach((s: any) => insertSection.run(s.id, s.title, s.subtitle, s.content, s.image_url));
            }

            if (data.menus && Array.isArray(data.menus)) {
                console.log(`${data.menus.length} adet menü yüklenecek.`);
                const insertMenu = db.prepare('INSERT INTO menus (id, title, path, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)');
                data.menus.forEach((m: any) => insertMenu.run(m.id, m.title, m.path, m.parent_id, m.sort_order));
            }

            if (data.services && Array.isArray(data.services)) {
                console.log(`${data.services.length} adet hizmet yüklenecek.`);
                const insertService = db.prepare('INSERT INTO services (id, title, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
                data.services.forEach((s: any) => insertService.run(s.id, s.title, s.description, s.icon, s.sort_order));
            }

            if (data.lawyers && Array.isArray(data.lawyers)) {
                console.log(`${data.lawyers.length} adet avukat yüklenecek.`);
                const insertLawyer = db.prepare('INSERT INTO lawyers (id, name, title, bio, image_url, linkedin_url, instagram_url, facebook_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                data.lawyers.forEach((l: any) => insertLawyer.run(l.id, l.name, l.title, l.bio, l.image_url, l.linkedin_url || '', l.instagram_url || '', l.facebook_url || '', l.sort_order));
            }

            if (data.messages && Array.isArray(data.messages)) {
                console.log(`${data.messages.length} adet mesaj yüklenecek.`);
                const insertMessage = db.prepare('INSERT INTO messages (id, name, email, message, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?)');
                data.messages.forEach((m: any) => insertMessage.run(m.id, m.name, m.email, m.message, m.created_at, m.is_read || 0));
            }

            if (data.appointments && Array.isArray(data.appointments)) {
                console.log(`${data.appointments.length} adet randevu yüklenecek.`);
                const insertAppointment = db.prepare('INSERT INTO appointments (id, name, phone, date, time, note, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                data.appointments.forEach((a: any) => insertAppointment.run(a.id, a.name, a.phone, a.date, a.time, a.note, a.created_at, a.status || 'pending'));
            }
        });


        transaction();
        console.log('Bulut geri yükleme işlemi veritabanında tamamlandı.');
        res.json({ success: true, message: 'Bulut yedeği Firebase üzerinden başarıyla geri yüklendi.' });
    } catch (error) {
        console.error('Cloud restore error:', error);
        res.status(500).json({ error: `Veri buluttan geri yüklenirken hata oluştu: ${error instanceof Error ? error.message : String(error)}` });
    }
});

// --- AI Endpoints ---

app.post('/api/ai/petition', async (req, res) => {
    const { caseType, parties, summary, documentType } = req.body;
    if (!caseType || !parties || !summary) {
        return res.status(400).json({ error: 'Eksik bilgi: Dava türü, taraflar ve özet gereklidir.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            Bir hukuk asistanı olarak, aşağıdaki bilgilere dayanarak profesyonel bir ${documentType} taslağı hazırla.
            Dava Türü: ${caseType}
            Taraflar: ${parties}
            Olay Özeti: ${summary}
            
            Lütfen resmi bir dil kullan, Türk hukuk sistemine uygun formatta (başlıklar, taraflar, konu, açıklamalar, hukuki deliller, sonuç ve istem) bir taslak oluştur.
            Markdown formatında çıktı ver.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ text });
    } catch (err: any) {
        console.error("Gemini Petition Error:", err);
        res.status(500).json({ error: "Yapay zeka yanıt oluştururken bir hata oluştu. Lütfen API anahtarını kontrol edin." });
    }
});

app.post('/api/ai/contract', async (req, res) => {
    const { contractType, details } = req.body;
    if (!contractType || !details) {
        return res.status(400).json({ error: 'Eksik bilgi: Sözleşme türü ve detaylar gereklidir.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            Bir hukuk asistanı olarak, aşağıdaki bilgilere dayanarak profesyonel bir ${contractType} taslağı hazırla.
            Detaylar: ${details}
            
            Lütfen resmi bir dil kullan, tarafların haklarını koruyan, Türk hukukuna uygun maddeler içeren bir sözleşme taslağı oluştur.
            Markdown formatında çıktı ver.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ text });
    } catch (err: any) {
        console.error("Gemini Contract Error:", err);
        res.status(500).json({ error: "Sözleşme oluşturulurken bir hata oluştu." });
    }
});

app.post('/api/ai/precedents', async (req, res) => {
    const { query } = req.body;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            Aşağıdaki hukuki uyuşmazlıkla ilgili olabilecek emsal Yargıtay veya Danıştay kararları hakkında özet bilgiler ver.
            Uyuşmazlık: ${query}
            
            Not: Tam karar metni yerine, kararların özünü ve hangi ilkeye dayandığını açıkla.
            Markdown formatında liste olarak ver.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json([{ id: 1, title: 'Emsal Karar Analizi', summary: text }]);
    } catch (err: any) {
        res.status(500).json({ error: "Emsal arama hatası" });
    }
});

app.post('/api/ai/analyze', async (req, res) => {
    const { content } = req.body;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            Aşağıdaki hukuki metni/dava dosyasını analiz et. Önemli noktaları, riskleri ve tavsiyeleri çıkar.
            Metin: ${content}
            
            Markdown formatında düzenli bir analiz raporu sun.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ 
            summary: "Analiz Tamamlandı",
            risks: ["Metin analizi sonucunda belirlenen riskler bu bölümde yer alır."],
            suggestions: ["Hukuki tavsiyeler buradadır."],
            fullAnalysis: text
        });
    } catch (err: any) {
        res.status(500).json({ error: "Analiz hatası" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
