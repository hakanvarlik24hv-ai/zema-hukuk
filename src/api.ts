import { db_cloud } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc, addDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';

let authToken = localStorage.getItem('admin_token') || '';

export const setAuthToken = (token: string) => {
    authToken = token;
    if (token) {
        localStorage.setItem('admin_token', token);
    } else {
        localStorage.removeItem('admin_token');
    }
};

export const fetchSettings = async () => {
    const snapshot = await getDocs(collection(db_cloud, 'settings'));
    const settings: any = {};
    snapshot.forEach(doc => {
        settings[doc.id] = doc.data().value;
    });
    return settings;
};

export const updateSettings = async (settings: any) => {
    const batch = writeBatch(db_cloud);
    Object.entries(settings).forEach(([key, value]) => {
        batch.set(doc(db_cloud, 'settings', key), { value });
    });
    await batch.commit();
    return { success: true };
};

export const verifyPassword = async (password: string) => {
    const docRef = doc(db_cloud, 'settings', 'admin_password');
    const docSnap = await getDoc(docRef);
    const expectedPassword = docSnap.exists() ? docSnap.data().value : 'admin123';

    if (password === expectedPassword) {
        setAuthToken(password);
        return { success: true };
    }
    return { success: false, error: 'Hatalı şifre' };
};

export const fetchPages = async () => {
    const snapshot = await getDocs(collection(db_cloud, 'pages'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchPageBySlug = async (slug: string) => {
    const q = query(collection(db_cloud, 'pages'), where("slug", "==", slug));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    throw new Error('Not found');
};

export const savePage = async (page: any) => {
    if (page.id) {
        const { id, ...data } = page;
        await updateDoc(doc(db_cloud, 'pages', String(id)), data);
        return { success: true };
    } else {
        const docRef = await addDoc(collection(db_cloud, 'pages'), page);
        return { id: docRef.id };
    }
};

export const deletePage = async (id: string | number) => {
    await deleteDoc(doc(db_cloud, 'pages', String(id)));
    return { success: true };
};

export const fetchSections = async () => {
    const snapshot = await getDocs(collection(db_cloud, 'sections'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateSection = async (id: string | number, section: any) => {
    await updateDoc(doc(db_cloud, 'sections', String(id)), section);
    return { success: true };
};

export const fetchMenus = async () => {
    const q = query(collection(db_cloud, 'menus'), orderBy('sort_order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveMenu = async (menu: any) => {
    if (menu.id) {
        const { id, ...data } = menu;
        await updateDoc(doc(db_cloud, 'menus', String(id)), data);
        return { success: true };
    } else {
        const docRef = await addDoc(collection(db_cloud, 'menus'), menu);
        return { id: docRef.id };
    }
};

export const deleteMenu = async (id: string | number) => {
    await deleteDoc(doc(db_cloud, 'menus', String(id)));
    return { success: true };
};

export const fetchServices = async () => {
    const q = query(collection(db_cloud, 'services'), orderBy('sort_order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveService = async (service: any) => {
    if (service.id) {
        const { id, ...data } = service;
        await updateDoc(doc(db_cloud, 'services', String(id)), data);
        return { success: true };
    } else {
        const docRef = await addDoc(collection(db_cloud, 'services'), service);
        return { id: docRef.id };
    }
};

export const deleteService = async (id: string | number) => {
    await deleteDoc(doc(db_cloud, 'services', String(id)));
    return { success: true };
};

export const fetchLawyers = async () => {
    const q = query(collection(db_cloud, 'lawyers'), orderBy('sort_order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveLawyer = async (lawyer: any) => {
    if (lawyer.id) {
        const { id, ...data } = lawyer;
        await updateDoc(doc(db_cloud, 'lawyers', String(id)), data);
        return { success: true };
    } else {
        const docRef = await addDoc(collection(db_cloud, 'lawyers'), lawyer);
        return { id: docRef.id };
    }
};

export const deleteLawyer = async (id: string | number) => {
    await deleteDoc(doc(db_cloud, 'lawyers', String(id)));
    return { success: true };
};

// Messages API
export const fetchMessages = async () => {
    const q = query(collection(db_cloud, 'messages'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const sendMessage = async (message: any) => {
    const payload = {
        ...message,
        created_at: new Date().toISOString(),
        is_read: 0
    };
    const docRef = await addDoc(collection(db_cloud, 'messages'), payload);
    return { id: docRef.id, success: true };
};

export const markMessageRead = async (id: string | number) => {
    await updateDoc(doc(db_cloud, 'messages', String(id)), { is_read: 1 });
    return { success: true };
};

export const deleteMessage = async (id: string | number) => {
    await deleteDoc(doc(db_cloud, 'messages', String(id)));
    return { success: true };
};

// Backup APIs (For legacy/frontend manual trigger)
export const exportBackup = async () => {
    const [settings, pages, sections, menus, services, lawyers, messages] = await Promise.all([
        fetchSettings(),
        fetchPages(),
        fetchSections(),
        fetchMenus(),
        fetchServices(),
        fetchLawyers(),
        fetchMessages()
    ]);

    const settingsArr = Object.keys(settings).map(key => ({ key, value: settings[key] }));

    return {
        settings: settingsArr,
        pages,
        sections,
        menus,
        services,
        lawyers,
        messages,
        export_date: new Date().toISOString(),
        version: '3.0'
    };
};

export const importBackup = async (data: any) => {
    try {
        const batch = writeBatch(db_cloud);

        if (data.settings) {
            data.settings.forEach((s: any) => {
                batch.set(doc(db_cloud, 'settings', s.key), { value: s.value });
            });
        }

        const arrs = ['pages', 'sections', 'menus', 'services', 'lawyers', 'messages'];
        arrs.forEach(coll => {
            if (data[coll] && Array.isArray(data[coll])) {
                data[coll].forEach((item: any) => {
                    const { id, ...itemData } = item;
                    // Provide an auto ID if missing during import
                    const targetDoc = id ? doc(db_cloud, coll, String(id)) : doc(collection(db_cloud, coll));
                    batch.set(targetDoc, itemData);
                });
            }
        });

        await batch.commit();
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export const cloudSave = async () => {
    try {
        const backupData = await exportBackup();
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

        const result = await importBackup(data);
        return result;

    } catch (error: any) {
        return { success: false, error: `Buluttan geri yükleme hatası: ${error.message}` };
    }
};
