import React, { useState, useEffect } from 'react';
import {
    fetchSettings, updateSettings,
    fetchPages, savePage, deletePage,
    fetchSections, updateSection,
    fetchMenus, saveMenu, deleteMenu,
    fetchServices, saveService, deleteService,
    fetchLawyers, saveLawyer, deleteLawyer,
    verifyPassword, exportBackup, importBackup, cloudSave, cloudRestore,
    fetchMessages, markMessageRead, deleteMessage
} from './api';
import {
    Save, Plus, Trash2, Edit2, X, Check, Settings,
    FileText, Layout, Menu as MenuIcon, ChevronDown, ChevronRight, Briefcase,
    Users as TeamIcon, Home, Lock, Eye, EyeOff,
    Download, CloudUpload, RefreshCw, Search, Share2, Globe, HelpCircle,
    Linkedin, Instagram, Facebook, Mail, MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const InfoTooltip = ({ text, example }: { text: string; example: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative inline-block ml-2 align-middle">
            <HelpCircle
                size={14}
                className="text-gold-500/40 hover:text-gold-500 cursor-help transition-colors"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            />
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-black/95 border border-gold-500/20 backdrop-blur-xl rounded-xl shadow-2xl z-[70] pointer-events-none"
                    >
                        <p className="text-[10px] text-gold-100/90 leading-relaxed mb-2 uppercase tracking-[0.05em] font-medium">{text}</p>
                        <div className="pt-2 border-t border-gold-500/10">
                            <span className="text-[8px] font-bold text-gold-500 uppercase block mb-1">ÖRNEK:</span>
                            <p className="text-[9px] text-gold-500/60 font-light italic leading-relaxed">{example}</p>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gold-500/20"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Admin = () => {
    const [activeTab, setActiveTab] = useState<'settings' | 'pages' | 'sections' | 'menus' | 'services' | 'lawyers' | 'seo' | 'messages'>('settings');
    const [settings, setSettings] = useState<any>({});
    const [pages, setPages] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [menus, setMenus] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [lawyers, setLawyers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);

    const [editingPage, setEditingPage] = useState<any>(null);
    const [editingSection, setEditingSection] = useState<any>(null);
    const [editingMenu, setEditingMenu] = useState<any>(null);
    const [editingService, setEditingService] = useState<any>(null);
    const [editingLawyer, setEditingLawyer] = useState<any>(null);
    const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            setIsAuthenticated(true);
        }
        loadData();
    }, []);

    const loadData = async () => {
        setIsDataLoading(true);
        try {
            const [settingsData, pagesData, sectionsData, menusData, servicesData, lawyersData, messagesData] = await Promise.all([
                fetchSettings(),
                fetchPages(),
                fetchSections(),
                fetchMenus(),
                fetchServices(),
                fetchLawyers(),
                fetchMessages()
            ]);
            setSettings(settingsData);
            setPages(pagesData);
            setSections(sectionsData);
            setMenus(menusData);
            setServices(servicesData);
            setLawyers(lawyersData);
            setMessages(messagesData || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsDataLoading(false);
        }
    };

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSettings(settings);
            showNotification('Ayarlar başarıyla kaydedildi.');
        } catch (error) {
            showNotification('Hata oluştu.', 'error');
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
            showNotification('Hata oluştu.', 'error');
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
            showNotification('Hata oluştu.', 'error');
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
            showNotification('Hata oluştu.', 'error');
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
            showNotification('Hata oluştu.', 'error');
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
            showNotification('Hata oluştu.', 'error');
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
            showNotification('Şifre en az 4 karakter olmalıdır.', 'error');
            return;
        }
        try {
            await updateSettings({ admin_password: newPassword });
            showNotification('Şifre başarıyla güncellendi.');
            // Don't need to reload everything, just the success message
        } catch (error) {
            showNotification('Hata oluştu veya oturumunuz sona erdi.', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.reload();
    };

    const handleBackupExport = async () => {
        try {
            const data = await exportBackup();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zema-hukuk-yedek-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showNotification('Veriler başarıyla bilgisayarınıza indirildi.');
        } catch (error) {
            showNotification('Yedek alınırken hata oluştu.', 'error');
        }
    };

    const handleBackupImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm('DİKKAT: Mevcut tüm veriler silinecek ve yedek dosyasındaki veriler yüklenecektir. Onaylıyor musunuz?')) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                const result = await importBackup(data);
                if (result.success) {
                    showNotification('Veriler başarıyla yüklendi. Sayfa yenileniyor...');
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    showNotification(result.error || 'Yükleme başarısız.', 'error');
                }
            } catch (error) {
                showNotification('Geçersiz yedek dosyası.', 'error');
            }
        };
        reader.readAsText(file);
    };

    const handleCloudSave = async () => {
        try {
            const result = await cloudSave();
            if (result.success) {
                showNotification('Veriler başarıyla buluta (sunucuya) yedeklendi.');
            } else {
                showNotification(result.error || 'Yedekleme başarısız.', 'error');
            }
        } catch (error) {
            showNotification('Bulut yedeği alınırken hata oluştu.', 'error');
        }
    };

    const handleCloudRestore = async () => {
        if (!window.confirm('DİKKAT: Mevcut verileriniz silinecek ve en son alınan bulut yedeği yüklenecektir. Onaylıyor musunuz?')) {
            return;
        }
        try {
            const result = await cloudRestore();
            if (result.success) {
                showNotification('Bulut yedeği başarıyla yüklendi. Sayfa yenileniyor...');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showNotification(result.error || 'Geri yükleme başarısız.', 'error');
            }
        } catch (error) {
            showNotification('Bulut yedeği yüklenirken hata oluştu.', 'error');
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
            <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6 bg-[url('https://i.ibb.co/Y7XzXKd2/arkaplan11.png')] bg-cover bg-scroll">
                <div className="absolute inset-0 bg-black/60 pointer-events-none" />
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
                        <AnimatePresence>
                            {notification && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                    className={`px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl backdrop-blur-md border ${notification.type === 'success'
                                        ? 'bg-green-500/20 border-green-500/50 text-green-200'
                                        : 'bg-red-500/20 border-red-500/50 text-red-200'
                                        }`}
                                >
                                    {notification.type === 'success' ? <Check size={18} /> : <X size={18} />}
                                    <span className="text-xs font-bold tracking-widest uppercase">{notification.msg}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-5 py-3 bg-red-900/10 hover:bg-red-900/20 text-red-500 border border-red-500/20 transition-all font-bold text-xs tracking-widest uppercase"
                        >
                            ÇIKIŞ YAP
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-10 bg-black/40 p-2 flex-col md:flex-row rounded-xl border border-gold-500/10 backdrop-blur-md">
                    {[
                        { id: 'settings', icon: Settings, label: 'AYARLAR' },
                        { id: 'messages', icon: MessageSquare, label: 'MESAJLAR' },
                        { id: 'menus', icon: MenuIcon, label: 'MENÜ' },
                        { id: 'pages', icon: FileText, label: 'SAYFALAR' },
                        { id: 'sections', icon: Layout, label: 'BÖLÜMLER' },
                        { id: 'services', icon: Briefcase, label: 'HİZMETLER' },
                        { id: 'lawyers', icon: TeamIcon, label: 'EKİBİMİZ' },
                        { id: 'seo', icon: Search, label: 'SEO/PAZARLAMA' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-1 w-full md:w-auto min-w-[110px] items-center justify-center gap-2 px-3 py-3 rounded-lg font-bold text-[10px] tracking-widest transition-all uppercase ${activeTab === tab.id
                                    ? 'bg-gold-500 text-dark-950 shadow-lg shadow-gold-500/20'
                                    : 'text-gold-500/60 hover:text-gold-300 hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={14} /> <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-8">
                        <form onSubmit={handleSettingsSave} className="glass-card p-8 space-y-6">
                            <h2 className="text-xl font-display font-bold text-gold-200 mb-4 border-b border-gold-500/10 pb-4">GENEL AYARLAR</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {Object.keys(settings).filter(key =>
                                    key !== 'admin_password' &&
                                    !key.startsWith('seo_') &&
                                    key !== 'google_analytics_id' &&
                                    key !== 'robots_txt' &&
                                    key !== 'contact_map_html'
                                ).map((key) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-xs font-bold tracking-widest text-gold-500 uppercase">{key.replace(/_/g, ' ')}</label>
                                        <input
                                            type="text"
                                            value={settings[key] || ''}
                                            onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                                            className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 pt-4">
                                <label className="text-xs font-bold tracking-widest text-gold-500 uppercase flex items-center gap-2">
                                    HARİTA EMBED KODU (IFRAME)
                                    <InfoTooltip text="Google Haritalar'dan aldığınız <iframe> ile başlayan yerleştirme kodunu buraya yapıştırın." example='<iframe src="https://www.google.com/maps/embed?..." width="600" height="450" ...></iframe>' />
                                </label>
                                <textarea
                                    value={settings.contact_map_html || ''}
                                    onChange={(e) => setSettings({ ...settings, contact_map_html: e.target.value })}
                                    className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none h-32 font-mono text-sm"
                                    placeholder='<iframe ...></iframe>'
                                />
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

                        {/* Cloud Backup Section */}
                        <div className="glass-card p-8 space-y-8 border-l-4 border-gold-500/30">
                            <div className="flex items-center gap-3">
                                <CloudUpload size={22} className="text-gold-500" />
                                <h2 className="text-xl font-display font-bold text-gold-200 uppercase tracking-widest">BULUT YEDEKLEME SİSTEMİ</h2>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-8 ring-1 ring-gold-500/10 p-6 bg-white/5 rounded-sm">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <RefreshCw size={16} className="text-gold-500 animate-spin-slow" />
                                        <h3 className="text-sm font-bold text-gold-400 tracking-widest uppercase">DOĞRUDAN BULUT SENKRONİZASYONU</h3>
                                    </div>
                                    <p className="text-xs text-gold-100/40 leading-relaxed uppercase tracking-wider">Dosya seçmenize gerek kalmadan verileri anında sunucu üzerindeki güvenli alana yedekler veya oradan geri yükler.</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={handleCloudSave}
                                            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gold-600 text-white hover:bg-gold-500 transition-all font-bold text-xs tracking-[0.2em] uppercase shadow-lg shadow-gold-900/20"
                                        >
                                            <CloudUpload size={18} /> BULUTA YÜKLE
                                        </button>
                                        <button
                                            onClick={handleCloudRestore}
                                            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 text-gold-200 border border-gold-500/20 transition-all font-bold text-xs tracking-[0.2em] uppercase"
                                        >
                                            <RefreshCw size={18} /> BULUTTAN GERİ YÜKLE
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 lg:border-l lg:border-gold-500/10 lg:pl-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Download size={16} className="text-gold-500/60" />
                                        <h3 className="text-sm font-bold text-gold-500/60 tracking-widest uppercase">MANUEL YEDEK (DOSYA)</h3>
                                    </div>
                                    <p className="text-[10px] text-gold-100/30 leading-relaxed uppercase tracking-wider italic">Verileri bilgisayarınıza bir dosya olarak indirmek veya o dosyadan geri yüklemek için kullanın.</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleBackupExport}
                                            className="p-3 bg-white/5 hover:bg-white/10 text-gold-500/60 border border-gold-500/10 transition-all"
                                            title="Dosya olarak indir"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <label className="flex-1 flex items-center justify-center gap-3 p-3 bg-white/5 hover:bg-white/10 text-gold-500/60 border border-gold-500/10 cursor-pointer transition-all font-bold text-[10px] tracking-widest uppercase">
                                            <CloudUpload size={16} /> YEDEK DOSYASI YÜKLE
                                            <input type="file" accept=".json" className="hidden" onChange={handleBackupImport} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SEO & Marketing Tab */}
                {activeTab === 'seo' && (
                    <div className="space-y-8">
                        <form onSubmit={handleSettingsSave} className="glass-card p-10 space-y-12">
                            <div className="flex items-center gap-4 border-b border-gold-500/10 pb-6">
                                <Search size={28} className="text-gold-500" />
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-gradient-gold uppercase tracking-tighter">SEO & Pazarlama Yönetimi</h2>
                                    <p className="text-gold-100/40 text-xs mt-1 uppercase tracking-widest">Sitenizi Google ve Sosyal Medya için Optimize Edin</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-12">
                                {/* Global SEO */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gold-500 tracking-[0.3em] uppercase flex items-center gap-2">
                                        <Globe size={16} /> Arama Motoru Ayarları
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <label className="text-[10px] font-bold text-gold-500/60 tracking-widest uppercase">Global Meta Başlık (Title)</label>
                                                <InfoTooltip text="Sitenin Google aramalarında görünen ana başlığıdır." example="Zema Hukuk & Arabuluculuk | İstanbul Hukuk Bürosu" />
                                            </div>
                                            <input
                                                type="text"
                                                value={settings.seo_title || ''}
                                                onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
                                                className="w-full bg-black/40 border border-gold-500/20 p-4 text-gold-100 focus:border-gold-500 outline-none transition-all"
                                                placeholder="Örn: Zema Hukuk | Modern Hukuk Çözümleri"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <label className="text-[10px] font-bold text-gold-500/60 tracking-widest uppercase">Meta Açıklama (Description)</label>
                                                <InfoTooltip text="Google arama sonuçlarında başlığın altında çıkan kısa tanıtım yazısıdır." example="Zema Hukuk, İstanbul'da uzman kadrosuyla profesyonel hukuk ve danışmanlık hizmetleri sunar." />
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={settings.seo_description || ''}
                                                onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
                                                className="w-full bg-black/40 border border-gold-500/20 p-4 text-gold-100 focus:border-gold-500 outline-none transition-all resize-none"
                                                placeholder="Arama sonuçlarında sitenizin altında görünecek olan kısa açıklama..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <label className="text-[10px] font-bold text-gold-500/60 tracking-widest uppercase">Anahtar Kelimeler (Keywords)</label>
                                                <InfoTooltip text="Arama motorlarının sitenizi kategorize etmesine yardımcı olan kelimelerdir." example="avukat, istanbul hukuk bürosu, boşanma avukatı, ceza hukuku" />
                                            </div>
                                            <input
                                                type="text"
                                                value={settings.seo_keywords || ''}
                                                onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
                                                className="w-full bg-black/40 border border-gold-500/20 p-4 text-gold-100 focus:border-gold-500 outline-none transition-all"
                                                placeholder="avukat, hukuk bürosu, istanbul, dava..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media & Analytics */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gold-500 tracking-[0.3em] uppercase flex items-center gap-2">
                                        <Share2 size={16} /> Sosyal Paylaşım & Analitik
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <label className="text-[10px] font-bold text-gold-500/60 tracking-widest uppercase">Paylaşım Görseli (OG Image URL)</label>
                                                <InfoTooltip text="Siteniz sosyal medyada paylaşıldığında (WhatsApp vb.) görünecek olan resmin linkidir." example="https://zemahukuk.com/images/og-main.jpg" />
                                            </div>
                                            <input
                                                type="text"
                                                value={settings.seo_og_image || ''}
                                                onChange={(e) => setSettings({ ...settings, seo_og_image: e.target.value })}
                                                className="w-full bg-black/40 border border-gold-500/20 p-4 text-gold-100 focus:border-gold-500 outline-none transition-all"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <label className="text-[10px] font-bold text-gold-500/60 tracking-widest uppercase">Google Analytics ID</label>
                                                <InfoTooltip text="Ziyaretçi trafiğini izlemek için kullanılan Google ölçüm kodudur." example="G-QLTVSG3N79" />
                                            </div>
                                            <input
                                                type="text"
                                                value={settings.google_analytics_id || ''}
                                                onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                                                className="w-full bg-black/40 border border-gold-500/20 p-4 text-gold-100 focus:border-gold-500 outline-none transition-all"
                                                placeholder="G-XXXXXXX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <label className="text-[10px] font-bold text-gold-500/60 tracking-widest uppercase">Robots.txt İçeriği</label>
                                                <InfoTooltip text="Google botlarının sitenin nerelerini tarayacağını belirleyen talimatlardır." example="User-agent: * \n Allow: /" />
                                            </div>
                                            <textarea
                                                rows={3}
                                                value={settings.robots_txt || ''}
                                                onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
                                                className="w-full bg-black/40 border border-gold-500/20 p-4 text-gold-100 font-mono text-xs focus:border-gold-500 outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn-gold-action w-full justify-center py-6 mt-6">
                                <Save size={20} /> SEO AYARLARINI GÜNCELLE
                            </button>
                        </form>
                    </div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                    <div className="space-y-6">
                        <div className="grid gap-4">
                            {messages.length === 0 ? (
                                <div className="glass-card p-12 text-center text-gold-500/40 font-bold tracking-widest uppercase">
                                    Henüz mesaj bulunmuyor.
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div key={message.id} className={`glass-card p-6 flex flex-col gap-4 transition-all ${message.is_read ? 'opacity-70' : 'border-l-4 border-gold-500'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-gold-200 font-display font-bold text-lg mb-1">{message.name}</h3>
                                                <div className="flex gap-4 text-xs text-gold-500/60 font-bold tracking-widest uppercase items-center">
                                                    <a href={`mailto:${message.email}`} className="hover:text-gold-400 transition-colors flex items-center gap-1"><Mail size={12} /> {message.email}</a>
                                                    <span>•</span>
                                                    <span>{new Date(message.created_at).toLocaleString('tr-TR')}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!message.is_read && (
                                                    <button
                                                        onClick={async () => {
                                                            await markMessageRead(message.id);
                                                            loadData();
                                                        }}
                                                        className="p-2 bg-gold-900/20 text-gold-500 hover:bg-gold-500 hover:text-black border border-gold-500/20 transition-all font-bold text-[10px] tracking-widest uppercase rounded flex items-center gap-1"
                                                    >
                                                        <Check size={14} /> OKUNDU İŞARETLE
                                                    </button>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Mesajı silmek istediğinize emin misiniz?')) {
                                                            await deleteMessage(message.id);
                                                            loadData();
                                                        }
                                                    }}
                                                    className="p-2 bg-red-900/10 hover:bg-red-900/30 text-red-500/70 hover:text-red-500 border border-red-500/20 transition-all rounded"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-gold-100/80 leading-relaxed font-light mt-2 p-4 bg-black/30 rounded-lg border border-gold-500/10 whitespace-pre-line">
                                            {message.message}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
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
                                onClick={() => setEditingPage({ title: '', slug: '', content: '', meta_title: '', meta_description: '', meta_keywords: '' })}
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
                                onClick={() => setEditingLawyer({ name: '', title: '', bio: '', image_url: '', linkedin_url: '', instagram_url: '', facebook_url: '', sort_order: lawyers.length })}
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
                                    <textarea rows={8} value={editingPage.content} onChange={e => setEditingPage({ ...editingPage, content: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 resize-none"></textarea>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 border-t border-gold-500/10 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gold-500 uppercase">Sayfa SEO Başlığı (Opsiyonel)</label>
                                        <input type="text" value={editingPage.meta_title || ''} onChange={e => setEditingPage({ ...editingPage, meta_title: e.target.value })} placeholder="Başlık boşsa sayfa adı kullanılır" className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 outline-none focus:border-gold-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gold-500 uppercase">Sayfa SEO Anahtar Kelimeler</label>
                                        <input type="text" value={editingPage.meta_keywords || ''} onChange={e => setEditingPage({ ...editingPage, meta_keywords: e.target.value })} placeholder="kelime1, kelime2..." className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 outline-none focus:border-gold-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gold-500 uppercase">Sayfa SEO Açıklaması</label>
                                    <textarea rows={2} value={editingPage.meta_description || ''} onChange={e => setEditingPage({ ...editingPage, meta_description: e.target.value })} placeholder="Sayfaya özel meta açıklaması..." className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 outline-none focus:border-gold-500 resize-none"></textarea>
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
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gold-500 uppercase flex items-center gap-2"><Linkedin size={12} /> LINKEDIN URL</label>
                                        <input type="text" value={editingLawyer.linkedin_url || ''} onChange={e => setEditingLawyer({ ...editingLawyer, linkedin_url: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" placeholder="https://linkedin.com/in/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gold-500 uppercase flex items-center gap-2"><Instagram size={12} /> INSTAGRAM URL</label>
                                        <input type="text" value={editingLawyer.instagram_url || ''} onChange={e => setEditingLawyer({ ...editingLawyer, instagram_url: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" placeholder="https://instagram.com/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gold-500 uppercase flex items-center gap-2"><Facebook size={12} /> FACEBOOK URL</label>
                                        <input type="text" value={editingLawyer.facebook_url || ''} onChange={e => setEditingLawyer({ ...editingLawyer, facebook_url: e.target.value })} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none" placeholder="https://facebook.com/..." />
                                    </div>
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
