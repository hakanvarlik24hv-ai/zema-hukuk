import React, { useState, useEffect } from 'react';
import {
    fetchSettings, updateSettings,
    fetchPages, savePage, deletePage,
    fetchSections, updateSection,
    fetchMenus, saveMenu, deleteMenu,
    fetchServices, saveService, deleteService,
    fetchLawyers, saveLawyer, deleteLawyer,
    verifyPassword
} from './api';
import {
    Save, Plus, Trash2, Edit2, X, Check, Settings,
    FileText, Layout, Menu as MenuIcon, ChevronDown, ChevronRight, Briefcase,
    Users as TeamIcon, Home, Lock, Eye, EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const Admin = () => {
    const [activeTab, setActiveTab] = useState<'settings' | 'pages' | 'sections' | 'menus' | 'services' | 'lawyers'>('settings');
    const [settings, setSettings] = useState<any>({});
    const [pages, setPages] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [menus, setMenus] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [lawyers, setLawyers] = useState<any[]>([]);

    const [editingPage, setEditingPage] = useState<any>(null);
    const [editingSection, setEditingSection] = useState<any>(null);
    const [editingMenu, setEditingMenu] = useState<any>(null);
    const [editingService, setEditingService] = useState<any>(null);
    const [editingLawyer, setEditingLawyer] = useState<any>(null);
    const [message, setMessage] = useState('');

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsDataLoading(true);
        try {
            const [settingsData, pagesData, sectionsData, menusData, servicesData, lawyersData] = await Promise.all([
                fetchSettings(),
                fetchPages(),
                fetchSections(),
                fetchMenus(),
                fetchServices(),
                fetchLawyers()
            ]);
            setSettings(settingsData);
            setPages(pagesData);
            setSections(sectionsData);
            setMenus(menusData);
            setServices(servicesData);
            setLawyers(lawyersData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsDataLoading(false);
        }
    };

    const showNotification = (msg: string, isError = false) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSettings(settings);
            showNotification('Ayarlar başarıyla kaydedildi.');
        } catch (error) {
            showNotification('Hata oluştu.', true);
        }
    };

    const handlePageSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await savePage(editingPage);
            setEditingPage(null);
            loadData();
            showNotification('Sayfa başarıyla kaydedildi.');
        } catch (error) {
            showNotification('Hata oluştu.', true);
        }
    };

    const handleSectionSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSection(editingSection.id, editingSection);
            setEditingSection(null);
            loadData();
            showNotification('Bölüm başarıyla kaydedildi.');
        } catch (error) {
            showNotification('Hata oluştu.', true);
        }
    };

    const handleMenuSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveMenu(editingMenu);
            setEditingMenu(null);
            loadData();
            showNotification('Menü öğesi başarıyla kaydedildi.');
        } catch (error) {
            showNotification('Hata oluştu.', true);
        }
    };

    const handleServiceSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveService(editingService);
            setEditingService(null);
            loadData();
            showNotification('Hizmet başarıyla kaydedildi.');
        } catch (error) {
            showNotification('Hata oluştu.', true);
        }
    };

    const handleLawyerSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveLawyer(editingLawyer);
            setEditingLawyer(null);
            loadData();
            showNotification('Avukat kaydı başarıyla oluşturuldu.');
        } catch (error) {
            showNotification('Hata oluştu.', true);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isDataLoading) return;

        try {
            const result = await verifyPassword(passwordInput);
            if (result.success) {
                setIsAuthenticated(true);
                setLoginError('');
            } else {
                setLoginError('Hatalı şifre. Lütfen tekrar deneyiniz.');
            }
        } catch (error) {
            setLoginError('Doğrulama sırasında bir hata oluştu.');
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        const newPassword = settings.admin_password;
        if (!newPassword || newPassword.length < 4) {
            showNotification('Şifre en az 4 karakter olmalıdır.', true);
            return;
        }
        try {
            await updateSettings({ admin_password: newPassword });
            showNotification('Şifre başarıyla güncellendi.');
        } catch (error) {
            showNotification('Hata oluştu.', true);
        }
    };

    const renderMenus = (parentId: number | null = null, depth = 0) => {
        const items = menus.filter(m => (m.parent_id === parentId || (!parentId && !m.parent_id)));

        // If we are looking for children, but parentId is something, filter correctly
        const filteredItems = parentId === null
            ? menus.filter(m => !m.parent_id)
            : menus.filter(m => m.parent_id === parentId);

        return filteredItems.map(menu => (
            <React.Fragment key={menu.id}>
                <div
                    className="glass-card p-4 flex justify-between items-center group transition-all mb-2"
                    style={{ marginLeft: `${depth * 2.5}rem`, borderLeft: depth > 0 ? '2px solid rgba(184, 138, 62, 0.3)' : 'none' }}
                >
                    <div className="flex items-center gap-3">
                        {depth > 0 && <ChevronRight size={16} className="text-gold-500/40" />}
                        <div>
                            <h3 className="text-gold-200 font-display font-bold tracking-wider">{menu.title}</h3>
                            <p className="text-xs text-gold-500/40 tracking-widest">{menu.path}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingMenu(menu)} className="p-2 text-gold-500 hover:text-gold-200">
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={async () => {
                                if (window.confirm('Emin misiniz? Alt menüler de silinecektir.')) {
                                    await deleteMenu(menu.id);
                                    loadData();
                                }
                            }}
                            className="p-2 text-red-500 hover:text-red-400"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                {renderMenus(menu.id, depth + 1)}
            </React.Fragment>
        ));
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6 bg-[url('https://i.ibb.co/Y7XzXKd2/arkaplan11.png')] bg-cover bg-fixed">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative glass-card w-full max-w-md p-10 space-y-8 z-10"
                >
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock size={32} className="text-gold-500" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-gradient-gold mb-2 uppercase">GİRİŞ YAP</h1>
                        <p className="text-gold-100/40 text-sm">Yönetim paneline erişmek için şifrenizi giriniz.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-bold text-gold-500 tracking-[0.3em] uppercase">ADMİN ŞİFRE</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className="w-full bg-black/40 border border-gold-500/20 p-4 text-gold-100 focus:border-gold-500 outline-none transition-all pr-12"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500/50 hover:text-gold-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {loginError && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-widest">{loginError}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={isDataLoading}
                            className={`btn-gold-action w-full justify-center ${isDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isDataLoading ? 'YÜKLENİYOR...' : 'GİRİŞ YAP'} {!isDataLoading && <Check size={18} />}
                        </button>
                    </form>

                    <div className="text-center pt-4">
                        <Link to="/" className="text-[10px] text-gold-500/40 hover:text-gold-500 tracking-widest uppercase transition-colors">Ana Sayfaya Dön</Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950 text-gold-100 p-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-4xl font-display font-bold text-gradient-gold">Yönetim Paneli</h1>
                    <div className="flex items-center gap-4">
                        {message && (
                            <div className="bg-gold-500/20 border border-gold-500/50 px-4 py-2 rounded text-gold-200 animate-pulse">
                                {message}
                            </div>
                        )}
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-gold-400 hover:text-gold-200 border border-gold-500/20 hover:border-gold-500/50 transition-all font-bold text-xs tracking-widest uppercase"
                        >
                            <Home size={16} /> SİTEYE DÖN
                        </Link>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-8">
                    {[
                        { id: 'settings', icon: Settings, label: 'AYARLAR' },
                        { id: 'menus', icon: MenuIcon, label: 'MENÜ' },
                        { id: 'pages', icon: FileText, label: 'SAYFALAR' },
                        { id: 'sections', icon: Layout, label: 'BÖLÜMLER' },
                        { id: 'services', icon: Briefcase, label: 'HİZMETLER' },
                        { id: 'lawyers', icon: TeamIcon, label: 'EKİBİMİZ' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-sm font-display font-bold transition-all ${activeTab === tab.id ? 'bg-gold-600 text-white' : 'bg-white/5 text-gold-500/60 hover:bg-white/10'}`}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-8">
                        <form onSubmit={handleSettingsSave} className="glass-card p-8 space-y-6">
                            <h2 className="text-xl font-display font-bold text-gold-200 mb-4 border-b border-gold-500/10 pb-4">GENEL AYARLAR</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {Object.keys(settings).filter(key => key !== 'admin_password').map((key) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-xs font-bold tracking-widest text-gold-500 uppercase">{key.replace('_', ' ')}</label>
                                        <input
                                            type="text"
                                            value={settings[key] || ''}
                                            onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                                            className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button type="submit" className="btn-gold-action w-full justify-center">
                                <Save size={20} /> AYARLARI KAYDET
                            </button>
                        </form>

                        <form onSubmit={handlePasswordChange} className="glass-card p-8 space-y-6 border-l-4 border-red-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock size={20} className="text-red-500" />
                                <h2 className="text-xl font-display font-bold text-gold-200">GÜVENLİK VE ŞİFRE</h2>
                            </div>
                            <div className="max-w-md space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-widest text-gold-500 uppercase">YENİ ADMİN ŞİFRESİ</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={settings.admin_password || ''}
                                            onChange={(e) => setSettings({ ...settings, admin_password: e.target.value })}
                                            className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none pr-12"
                                            placeholder="Yeni şifre giriniz"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500/50 hover:text-gold-500"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gold-500/40 uppercase tracking-widest">En az 4 karakterden oluşan güvenli bir şifre belirleyiniz.</p>
                                </div>
                                <button type="submit" className="bg-red-900/20 border border-red-500/30 text-red-500 px-6 py-3 font-bold text-xs tracking-widest uppercase hover:bg-red-900/40 transition-all flex items-center gap-2">
                                    <Lock size={16} /> ŞİFREYİ GÜNCELLE
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Menus Tab */}
                {activeTab === 'menus' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setEditingMenu({ title: '', path: '', parent_id: null, sort_order: menus.length + 1 })}
                                className="btn-gold-action"
                            >
                                <Plus size={20} /> YENİ MENÜ ÖĞESİ
                            </button>
                        </div>
                        <div className="grid gap-2">
                            {renderMenus()}
                        </div>
                    </div>
                )}

                {/* Pages Tab */}
                {activeTab === 'pages' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setEditingPage({ title: '', slug: '', content: '' })}
                                className="btn-gold-action"
                            >
                                <Plus size={20} /> YENİ SAYFA EKLE
                            </button>
                        </div>
                        <div className="grid gap-4">
                            {pages.map((page) => (
                                <div key={page.id} className="glass-card p-4 flex justify-between items-center group">
                                    <div>
                                        <h3 className="text-gold-200 font-display font-bold tracking-wider">{page.title}</h3>
                                        <p className="text-xs text-gold-500/40 tracking-widest">/p/{page.slug}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingPage(page)} className="p-2 text-gold-500 hover:text-gold-200"><Edit2 size={20} /></button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Silmek istediğinize emin misiniz?')) {
                                                    await deletePage(page.id);
                                                    loadData();
                                                }
                                            }}
                                            className="p-2 text-red-500 hover:text-red-400"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sections Tab */}
                {activeTab === 'sections' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {sections.map(section => (
                            <div key={section.id} className="glass-card p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-gold-200 font-display font-bold text-lg mb-2">{section.subtitle}</h3>
                                    <p className="text-gold-100/40 text-sm line-clamp-3">{section.content}</p>
                                </div>
                                <button
                                    onClick={() => setEditingSection(section)}
                                    className="mt-6 flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-gold-500 transition-all font-bold text-xs tracking-widest"
                                >
                                    <Edit2 size={16} /> DÜZENLE
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setEditingService({ title: '', description: '', icon: 'Gavel', sort_order: services.length })}
                                className="btn-gold-action"
                            >
                                <Plus size={20} /> YENİ HİZMET EKLE
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map((service) => (
                                <div key={service.id} className="glass-card p-4 flex justify-between items-center group">
                                    <div>
                                        <h3 className="text-gold-200 font-display font-bold tracking-wider">{service.title}</h3>
                                        <p className="text-xs text-gold-500/40 tracking-widest line-clamp-1">{service.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingService(service)} className="p-2 text-gold-500 hover:text-gold-200"><Edit2 size={20} /></button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Silmek istediğinize emin misiniz?')) {
                                                    await deleteService(service.id);
                                                    loadData();
                                                }
                                            }}
                                            className="p-2 text-red-500 hover:text-red-400"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lawyers Tab */}
                {activeTab === 'lawyers' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setEditingLawyer({ name: '', title: '', bio: '', image_url: '', sort_order: lawyers.length })}
                                className="btn-gold-action"
                            >
                                <Plus size={20} /> YENİ AVUKAT EKLE
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lawyers.map((lawyer) => (
                                <div key={lawyer.id} className="glass-card overflow-hidden group">
                                    <div className="aspect-[3/4] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                                        <img src={lawyer.image_url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f'} alt={lawyer.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-display font-bold text-gold-200">{lawyer.name}</h3>
                                        <p className="text-gold-500 text-xs tracking-widest uppercase mb-4">{lawyer.title}</p>
                                        <div className="flex gap-4">
                                            <button onClick={() => setEditingLawyer(lawyer)} className="flex-1 flex justify-center p-2 bg-white/5 hover:bg-white/10 text-gold-500 transition-all"><Edit2 size={18} /></button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Avukat kaydını silmek istediğinize emin misiniz?')) {
                                                        await deleteLawyer(lawyer.id);
                                                        loadData();
                                                    }
                                                }}
                                                className="flex-1 flex justify-center p-2 bg-red-900/10 hover:bg-red-900/20 text-red-500 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Edit Modals */}
                {editingMenu && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                        <div className="glass-card w-full max-w-lg p-8 space-y-6">
                            <h2 className="text-2xl font-display font-bold text-gold-200">{editingMenu.id ? 'Menüyü Düzenle' : 'Yeni Menü Öğesi'}</h2>
                            <form onSubmit={handleMenuSave} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">BAŞLIK</label>
                                    <input type="text" required value={editingMenu.title} onChange={e => setEditingMenu({ ...editingMenu, title: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">PATH (Link)</label>
                                    <input type="text" required value={editingMenu.path} onChange={e => setEditingMenu({ ...editingMenu, path: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">ÜST MENÜ</label>
                                    <select
                                        value={editingMenu.parent_id || ''}
                                        onChange={e => setEditingMenu({ ...editingMenu, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none"
                                    >
                                        <option value="">Yok (Ana Menü)</option>
                                        {menus.filter(m => !m.parent_id && m.id !== editingMenu.id).map(m => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-1 btn-gold-action justify-center"><Check size={20} /> KAYDET</button>
                                    <button type="button" onClick={() => setEditingMenu(null)} className="flex-1 p-3 bg-red-900/20 text-red-500 border border-red-500/20 font-bold text-xs tracking-widest uppercase hover:bg-red-900/40 transition-all">İPTAL</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {editingSection && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                        <div className="glass-card w-full max-w-3xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-display font-bold text-gold-200">Bölümü Düzenle: {editingSection.id}</h2>
                            <form onSubmit={handleSectionSave} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">Üst Başlık (Subtitle)</label>
                                    <input type="text" value={editingSection.subtitle} onChange={e => setEditingSection({ ...editingSection, subtitle: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">Ana Başlık</label>
                                    <input type="text" value={editingSection.title} onChange={e => setEditingSection({ ...editingSection, title: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">Resim URL (Silmek için boş bırakın)</label>
                                    <div className="flex gap-4 items-center">
                                        <input type="text" value={editingSection.image_url || ''} onChange={e => setEditingSection({ ...editingSection, image_url: e.target.value })} className="flex-1 bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                        {editingSection.image_url && (
                                            <button type="button" onClick={() => setEditingSection({ ...editingSection, image_url: '' })} className="p-3 bg-red-900/20 text-red-500 border border-red-500/20"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">İçerik</label>
                                    <textarea rows={8} value={editingSection.content} onChange={e => setEditingSection({ ...editingSection, content: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none resize-none"></textarea>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-1 btn-gold-action justify-center"><Check size={20} /> KAYDET</button>
                                    <button type="button" onClick={() => setEditingSection(null)} className="flex-1 p-3 bg-red-900/20 text-red-500 border border-red-500/20 font-bold text-xs tracking-widest uppercase">İPTAL</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {editingPage && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                        <div className="glass-card w-full max-w-3xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-display font-bold text-gold-200">{editingPage.id ? 'Sayfayı Düzenle' : 'Yeni Sayfa Ekle'}</h2>
                            <form onSubmit={handlePageSave} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">Sayfa Başlığı</label>
                                    <input type="text" required value={editingPage.title} onChange={e => setEditingPage({ ...editingPage, title: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">Slug (URL)</label>
                                    <input type="text" required value={editingPage.slug} onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">Arka Plan Görseli URL (Opsiyonel)</label>
                                    <div className="flex gap-3 items-center">
                                        <input type="text" value={editingPage.bg_image || ''} onChange={e => setEditingPage({ ...editingPage, bg_image: e.target.value })} placeholder="https://..." className="flex-1 bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                        {editingPage.bg_image && (
                                            <button type="button" onClick={() => setEditingPage({ ...editingPage, bg_image: '' })} className="p-3 bg-red-900/20 text-red-500 border border-red-500/20 hover:bg-red-900/40"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                    {editingPage.bg_image && (
                                        <img src={editingPage.bg_image} alt="Önizleme" className="w-full h-24 object-cover rounded opacity-60 mt-2" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">İçerik (HTML)</label>
                                    <textarea rows={12} value={editingPage.content} onChange={e => setEditingPage({ ...editingPage, content: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 resize-none"></textarea>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-1 btn-gold-action justify-center"><Check size={20} /> KAYDET</button>
                                    <button type="button" onClick={() => setEditingPage(null)} className="flex-1 p-3 bg-red-900/20 text-red-500 border border-red-500/20 font-bold text-xs tracking-widest uppercase">İPTAL</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {editingService && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                        <div className="glass-card w-full max-w-2xl p-8 space-y-6">
                            <h2 className="text-2xl font-display font-bold text-gold-200">{editingService.id ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}</h2>
                            <form onSubmit={handleServiceSave} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">Hizmet Başlığı</label>
                                    <input type="text" required value={editingService.title} onChange={e => setEditingService({ ...editingService, title: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">İkon (Lucide adı örn: Gavel, Users, Scale)</label>
                                    <input type="text" required value={editingService.icon} onChange={e => setEditingService({ ...editingService, icon: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">Kısa Açıklama</label>
                                    <textarea rows={4} value={editingService.description} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none resize-none"></textarea>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-1 btn-gold-action justify-center"><Check size={20} /> KAYDET</button>
                                    <button type="button" onClick={() => setEditingService(null)} className="flex-1 p-3 bg-red-900/20 text-red-500 border border-red-500/20 font-bold text-xs tracking-widest uppercase">İPTAL</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {editingLawyer && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                        <div className="glass-card w-full max-w-3xl p-8 space-y-6 max-h-[90vh] overflow-y-auto text-gold-100">
                            <h2 className="text-2xl font-display font-bold text-gold-200">{editingLawyer.id ? 'Avukat Kaydını Düzenle' : 'Yeni Avukat Ekle'}</h2>
                            <form onSubmit={handleLawyerSave} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gold-500 uppercase">AD SOYAD</label>
                                        <input type="text" required value={editingLawyer.name} onChange={e => setEditingLawyer({ ...editingLawyer, name: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gold-500 uppercase">ÜNVAN (Örn: Kurucu Ortak)</label>
                                        <input type="text" required value={editingLawyer.title} onChange={e => setEditingLawyer({ ...editingLawyer, title: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">RESİM URL</label>
                                    <input type="text" required value={editingLawyer.image_url} onChange={e => setEditingLawyer({ ...editingLawyer, image_url: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gold-500 uppercase">ÖZGEÇMİŞ (BİO)</label>
                                    <textarea rows={6} value={editingLawyer.bio} onChange={e => setEditingLawyer({ ...editingLawyer, bio: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none resize-none"></textarea>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-1 btn-gold-action justify-center"><Check size={20} /> KAYDET</button>
                                    <button type="button" onClick={() => setEditingLawyer(null)} className="flex-1 p-3 bg-red-900/20 text-red-500 border border-red-500/20 font-bold text-xs tracking-widest uppercase">İPTAL</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
