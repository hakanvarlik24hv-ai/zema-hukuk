import { db_cloud } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let authToken = localStorage.getItem('admin_token') || '';
const API_BASE = import.meta.env.VITE_API_URL || '';

export const setAuthToken = (token: string) => {
    authToken = token;
    if (token) {
        localStorage.setItem('admin_token', token);
    } else {
        localStorage.removeItem('admin_token');
    }
};

const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

const secureFetch = async (url: string, options: any = {}) => {
    const isGet = !options.method || options.method === 'GET';
    if (isGet && apiCache.has(url)) {
        const cached = apiCache.get(url)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = authToken;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            setAuthToken('');
            throw new Error('Unauthorized');
        }
        const data = await response.json();
        if (isGet) {
            apiCache.set(url, { data, timestamp: Date.now() });
        } else {
            apiCache.clear();
        }
        return data;
    } catch (error) {
        console.error(`API Error (${url}):`, error);
        throw error;
    }
};

export const fetchSettings = async () => secureFetch(`${API_BASE}/api/settings`);

export const updateSettings = async (settings: any) => secureFetch(`${API_BASE}/api/settings`, {
    method: 'POST',
    body: JSON.stringify(settings)
});

export const verifyPassword = async (password: string) => {
    const response = await fetch(`${API_BASE}/api/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    const data = await response.json();
    if (data.success) {
        setAuthToken(password);
    }
    return data;
};

export const fetchPages = async () => secureFetch(`${API_BASE}/api/pages`);
export const fetchPageBySlug = async (slug: string) => secureFetch(`${API_BASE}/api/pages/${slug}`);
export const savePage = async (page: any) => {
    const method = page.id ? 'PUT' : 'POST';
    const url = page.id ? `${API_BASE}/api/pages/${page.id}` : `${API_BASE}/api/pages`;
    return secureFetch(url, { method, body: JSON.stringify(page) });
};
export const deletePage = async (id: number) => secureFetch(`${API_BASE}/api/pages/${id}`, { method: 'DELETE' });

export const fetchSections = async () => secureFetch(`${API_BASE}/api/sections`);
export const updateSection = async (id: string, section: any) => secureFetch(`${API_BASE}/api/sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(section)
});

export const fetchMenus = async () => secureFetch(`${API_BASE}/api/menus`);
export const saveMenu = async (menu: any) => {
    const method = menu.id ? 'PUT' : 'POST';
    const url = menu.id ? `${API_BASE}/api/menus/${menu.id}` : `${API_BASE}/api/menus`;
    return secureFetch(url, { method, body: JSON.stringify(menu) });
};
export const deleteMenu = async (id: number) => secureFetch(`${API_BASE}/api/menus/${id}`, { method: 'DELETE' });

export const fetchServices = async () => secureFetch(`${API_BASE}/api/services`);
export const saveService = async (service: any) => {
    const method = service.id ? 'PUT' : 'POST';
    const url = service.id ? `${API_BASE}/api/services/${service.id}` : `${API_BASE}/api/services`;
    return secureFetch(url, { method, body: JSON.stringify(service) });
};
export const deleteService = async (id: number) => secureFetch(`${API_BASE}/api/services/${id}`, { method: 'DELETE' });

export const fetchLawyers = async () => secureFetch(`${API_BASE}/api/lawyers`);
export const saveLawyer = async (lawyer: any) => {
    const method = lawyer.id ? 'PUT' : 'POST';
    const url = lawyer.id ? `${API_BASE}/api/lawyers/${lawyer.id}` : `${API_BASE}/api/lawyers`;
    return secureFetch(url, { method, body: JSON.stringify(lawyer) });
};
export const deleteLawyer = async (id: number) => secureFetch(`${API_BASE}/api/lawyers/${id}`, { method: 'DELETE' });

export const exportBackup = async () => secureFetch(`${API_BASE}/api/backup/export`);
export const importBackup = async (data: any) => secureFetch(`${API_BASE}/api/backup/import`, {
    method: 'POST',
    body: JSON.stringify(data)
});

// --- Cloud Save/Restore: Directly via Firestore from Frontend ---

export const cloudSave = async () => {
    try {
        const [settings, pages, sections, menus, services, lawyers] = await Promise.all([
            fetchSettings(),
            fetchPages(),
            fetchSections(),
            fetchMenus(),
            fetchServices(),
            fetchLawyers(),
        ]);

        const backupData = {
            settings,
            pages,
            sections,
            menus,
            services,
            lawyers,
            export_date: new Date().toISOString(),
            version: '2.0',
        };

        const backupRef = doc(db_cloud, 'site_management', 'latest_backup');
        await setDoc(backupRef, {
            data: JSON.stringify(backupData),
            updated_at: new Date().toISOString(),
        });

        return { success: true, message: 'Veriler Firestore Bulut Veritabanına başarıyla yedeklendi.' };
    } catch (error: any) {
        console.error('Cloud save error:', error);
        return { success: false, error: `Buluta kaydetme hatası: ${error.message}` };
    }
};

export const cloudRestore = async () => {
    try {
        const backupRef = doc(db_cloud, 'site_management', 'latest_backup');
        const docSnap = await getDoc(backupRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Henüz bir bulut yedeği bulunamadı.' };
        }

        const cloudData = docSnap.data();
        const data = JSON.parse(cloudData.data);

        const result = await secureFetch(`${API_BASE}/api/backup/import`, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        return result;
    } catch (error: any) {
        console.error('Cloud restore error:', error);
        return { success: false, error: `Buluttan geri yükleme hatası: ${error.message}` };
    }
};

// --- Messages API ---
export const fetchMessages = async () => secureFetch(`${API_BASE}/api/messages`);
export const sendMessage = async (message: any) => secureFetch(`${API_BASE}/api/messages`, {
    method: 'POST',
    body: JSON.stringify(message)
});
export const markMessageRead = async (id: number) => secureFetch(`${API_BASE}/api/messages/${id}/read`, { method: 'PUT' });
export const deleteMessage = async (id: number) => secureFetch(`${API_BASE}/api/messages/${id}`, { method: 'DELETE' });

