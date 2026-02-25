const API_BASE = import.meta.env.VITE_API_URL || '';

export const fetchSettings = async () => {
    const response = await fetch(`${API_BASE}/api/settings`);
    return response.json();
};

export const updateSettings = async (settings: any) => {
    const response = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    return response.json();
};

export const fetchPages = async () => {
    const response = await fetch(`${API_BASE}/api/pages`);
    return response.json();
};

export const fetchPageBySlug = async (slug: string) => {
    const response = await fetch(`${API_BASE}/api/pages/${slug}`);
    return response.json();
};

export const savePage = async (page: any) => {
    const method = page.id ? 'PUT' : 'POST';
    const url = page.id ? `${API_BASE}/api/pages/${page.id}` : `${API_BASE}/api/pages`;
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page)
    });
    return response.json();
};

export const deletePage = async (id: number) => {
    const response = await fetch(`${API_BASE}/api/pages/${id}`, {
        method: 'DELETE'
    });
    return response.json();
};

export const fetchSections = async () => {
    const response = await fetch(`${API_BASE}/api/sections`);
    return response.json();
};

export const updateSection = async (id: string, section: any) => {
    const response = await fetch(`${API_BASE}/api/sections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(section)
    });
    return response.json();
};

export const fetchMenus = async () => {
    const response = await fetch(`${API_BASE}/api/menus`);
    return response.json();
};

export const saveMenu = async (menu: any) => {
    const method = menu.id ? 'PUT' : 'POST';
    const url = menu.id ? `${API_BASE}/api/menus/${menu.id}` : `${API_BASE}/api/menus`;
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu)
    });
    return response.json();
};

export const deleteMenu = async (id: number) => {
    const response = await fetch(`${API_BASE}/api/menus/${id}`, {
        method: 'DELETE'
    });
    return response.json();
};

export const fetchServices = async () => {
    const response = await fetch(`${API_BASE}/api/services`);
    return response.json();
};

export const saveService = async (service: any) => {
    const method = service.id ? 'PUT' : 'POST';
    const url = service.id ? `${API_BASE}/api/services/${service.id}` : `${API_BASE}/api/services`;
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
    });
    return response.json();
};

export const deleteService = async (id: number) => {
    const response = await fetch(`${API_BASE}/api/services/${id}`, {
        method: 'DELETE'
    });
    return response.json();
};

export const fetchLawyers = async () => {
    const response = await fetch(`${API_BASE}/api/lawyers`);
    return response.json();
};

export const saveLawyer = async (lawyer: any) => {
    const method = lawyer.id ? 'PUT' : 'POST';
    const url = lawyer.id ? `${API_BASE}/api/lawyers/${lawyer.id}` : `${API_BASE}/api/lawyers`;
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lawyer)
    });
    return response.json();
};

export const deleteLawyer = async (id: number) => {
    const response = await fetch(`${API_BASE}/api/lawyers/${id}`, {
        method: 'DELETE'
    });
    return response.json();
};
