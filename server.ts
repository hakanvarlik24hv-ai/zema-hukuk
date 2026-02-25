import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new Database('database.db');

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
    sort_order INTEGER DEFAULT 0
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

// Seed default settings if empty
const settingsCount = (db.prepare('SELECT COUNT(*) as count FROM settings').get() as any).count;
if (settingsCount === 0) {
    const defaultSettings = [
        { key: 'site_name', value: 'ZEMA HUKUK BÜROSU' },
        { key: 'site_logo', value: 'https://i.hizliresim.com/gj3qd7x.png' },
        { key: 'contact_address', value: 'Bahçelievler Mah. Adalet Cad. No: 11 - 20/1 / İstanbul' },
        { key: 'contact_phone', value: '+90 (212) 300 35 66' },
        { key: 'contact_email', value: 'bilgi@zemahukuk.com' },
        { key: 'social_instagram', value: '#' },
        { key: 'social_facebook', value: '#' },
        { key: 'social_twitter', value: '#' }
    ];

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    defaultSettings.forEach(s => insertSetting.run(s.key, s.value));
}

// Routes
app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});
    res.json(settingsMap);
});

app.post('/api/settings', (req, res) => {
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

app.post('/api/pages', (req, res) => {
    const { title, slug, content, bg_image } = req.body;
    try {
        const info = db.prepare('INSERT INTO pages (title, slug, content, bg_image) VALUES (?, ?, ?, ?)').run(title, slug, content, bg_image || '');
        res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/pages/:id', (req, res) => {
    const { title, slug, content, bg_image, is_active } = req.body;
    try {
        db.prepare('UPDATE pages SET title = ?, slug = ?, content = ?, bg_image = ?, is_active = ? WHERE id = ?').run(title, slug, content, bg_image || '', is_active, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/pages/:id', (req, res) => {
    db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Sections
app.get('/api/sections', (req, res) => {
    const sections = db.prepare('SELECT * FROM sections').all();
    res.json(sections);
});

app.put('/api/sections/:id', (req, res) => {
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

app.post('/api/menus', (req, res) => {
    const { title, path, parent_id, sort_order } = req.body;
    try {
        const info = db.prepare('INSERT INTO menus (title, path, parent_id, sort_order) VALUES (?, ?, ?, ?)').run(title, path, parent_id || null, sort_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/menus/:id', (req, res) => {
    const { title, path, parent_id, sort_order } = req.body;
    try {
        db.prepare('UPDATE menus SET title = ?, path = ?, parent_id = ?, sort_order = ? WHERE id = ?').run(title, path, parent_id || null, sort_order || 0, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/menus/:id', (req, res) => {
    db.prepare('DELETE FROM menus WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Services
app.get('/api/services', (req, res) => {
    const services = db.prepare('SELECT * FROM services ORDER BY sort_order').all();
    res.json(services);
});

app.post('/api/services', (req, res) => {
    const { title, description, icon, sort_order } = req.body;
    try {
        const info = db.prepare('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)').run(title, description, icon, sort_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/services/:id', (req, res) => {
    const { title, description, icon, sort_order } = req.body;
    try {
        db.prepare('UPDATE services SET title = ?, description = ?, icon = ?, sort_order = ? WHERE id = ?').run(title, description, icon, sort_order, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/services/:id', (req, res) => {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Lawyers
app.get('/api/lawyers', (req, res) => {
    const lawyers = db.prepare('SELECT * FROM lawyers ORDER BY sort_order').all();
    res.json(lawyers);
});

app.post('/api/lawyers', (req, res) => {
    const { name, title, bio, image_url, sort_order } = req.body;
    try {
        const info = db.prepare('INSERT INTO lawyers (name, title, bio, image_url, sort_order) VALUES (?, ?, ?, ?, ?)').run(name, title, bio, image_url, sort_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/lawyers/:id', (req, res) => {
    const { name, title, bio, image_url, sort_order } = req.body;
    try {
        db.prepare('UPDATE lawyers SET name = ?, title = ?, bio = ?, image_url = ?, sort_order = ? WHERE id = ?').run(name, title, bio, image_url, sort_order, req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/lawyers/:id', (req, res) => {
    db.prepare('DELETE FROM lawyers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
