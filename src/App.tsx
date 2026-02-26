/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Scale, Gavel, Shield, Users, Phone, Mail, MapPin,
  ChevronRight, Briefcase, BookOpen, ArrowRight, Instagram, Facebook, Twitter,
  Menu, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { fetchSettings, fetchPages, fetchPageBySlug, fetchMenus, fetchSections, fetchServices, fetchLawyers } from './api';

const Admin = React.lazy(() => import('./Admin'));

// --- Shared Components ---

const Navbar = ({ settings, menus }: { settings: any, menus: any[] }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const topMenus = menus.filter(m => !m.parent_id);

  const renderNavLink = (menu: any) => {
    const subMenus = menus.filter(m => m.parent_id === menu.id);
    const hasSub = subMenus.length > 0;

    return (
      <div
        key={menu.id}
        className="relative group h-full flex items-center"
        onMouseEnter={() => setActiveSubMenu(menu.id)}
        onMouseLeave={() => setActiveSubMenu(null)}
      >
        {menu.path.startsWith('/#') ? (
          <a href={menu.path} className="text-[10px] font-bold tracking-[0.2em] text-gold-100/70 hover:text-gold-400 transition-colors uppercase h-full flex items-center gap-1">
            {menu.title} {hasSub && <ChevronDown size={10} />}
          </a>
        ) : (
          <Link to={menu.path} className="text-[10px] font-bold tracking-[0.2em] text-gold-100/70 hover:text-gold-400 transition-colors uppercase h-full flex items-center gap-1">
            {menu.title} {hasSub && <ChevronDown size={10} />}
          </Link>
        )}

        {hasSub && (
          <div className={`absolute top-full right-0 w-48 bg-black/95 border border-gold-500/10 backdrop-blur-xl shadow-2xl transition-all duration-300 origin-top overflow-hidden ${activeSubMenu === menu.id ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}>
            <div className="flex flex-col p-2">
              {subMenus.map(sub => (
                sub.path.startsWith('/#') ? (
                  <a key={sub.id} href={sub.path} className="px-4 py-2 text-[10px] text-gold-200/60 hover:text-gold-400 hover:bg-gold-500/5 transition-all tracking-widest uppercase">
                    {sub.title}
                  </a>
                ) : (
                  <Link key={sub.id} to={sub.path} className="px-4 py-2 text-[10px] text-gold-200/60 hover:text-gold-400 hover:bg-gold-500/5 transition-all tracking-widest uppercase">
                    {sub.title}
                  </Link>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-black/95 py-4 shadow-2xl backdrop-blur-md' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-12">
        <div className="flex items-center">
          {/* Logo removed per user request */}
        </div>

        {/* Desktop Menu - visible when scrolled */}
        <div className="hidden lg:flex gap-8 items-center h-full">
          {isScrolled && topMenus.filter(m => !menus.some(sub => sub.parent_id === m.id)).map((menu) => (
            <a
              key={menu.id}
              href={menu.path}
              className="relative text-[10px] font-extrabold tracking-[0.3em] text-gold-200/70 hover:text-gold-300 transition-colors duration-300 uppercase whitespace-nowrap"
              style={{ display: 'inline-block' }}
            >
              {menu.title}
              <span
                className="absolute left-0 -bottom-1 h-px bg-gradient-to-r from-gold-500 to-gold-300 w-full origin-left"
                style={{ transform: 'scaleX(0)', transition: 'transform 0.35s ease' }}
                ref={(el) => {
                  if (!el) return;
                  const parent = el.parentElement;
                  if (!parent) return;
                  parent.addEventListener('mouseenter', () => { el.style.transform = 'scaleX(1)'; });
                  parent.addEventListener('mouseleave', () => { el.style.transform = 'scaleX(0)'; });
                }}
              />
            </a>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden text-gold-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:hidden fixed inset-0 top-0 bg-black/98 z-[60] flex flex-col p-8 overflow-y-auto"
          >
            <div className="flex justify-end p-4">
              <button className="text-gold-500" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-8 text-center justify-center">
              {menus.map(menu => (
                <div key={menu.id} className="flex flex-col gap-2">
                  {menu.path.startsWith('/#') ? (
                    <a
                      href={menu.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-bold text-gold-200 tracking-[0.4em] uppercase"
                    >
                      {menu.title}
                    </a>
                  ) : (
                    <Link
                      to={menu.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-bold text-gold-200 tracking-[0.4em] uppercase"
                    >
                      {menu.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ settings, menus }: { settings: any, menus: any[] }) => (
  <section className="relative min-h-[100vh] flex flex-col items-center pt-[2vh] md:pt-[5vh] pb-24 text-center px-6">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="z-10 flex flex-col items-center mb-[2vw] relative w-full"
    >
      {/* Logo + Links side by side */}
      {/* Logo + Button centered */}
      <div className="flex flex-col items-center relative z-20 w-full -mt-6 md:mt-0">
        <img
          src={settings.site_logo}
          alt="ZEMA Logo"
          className="w-[70vw] md:w-[38vw] max-w-[500px] h-auto mb-2"
          loading="eager"
        />
        <p className="text-gold-200/80 font-display font-bold tracking-[0.4em] text-[clamp(7px,1.5vw,12px)] uppercase mb-6 mt-[-6vw] md:mt-[-1.5rem] lg:mt-[-3rem]">ADALET VE GÜVENİN ADRESİ</p>
        <a href="#iletisim" className="btn-gold-action group scale-90 md:scale-100">
          RANDEVU AL <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      {/* Navigation Links - Positioned to the right but not pushing the center */}
      <div className="hidden lg:flex flex-col gap-5 bg-white/5 backdrop-blur-2xl border border-gold-500/15 px-6 py-5 rounded-2xl shadow-xl absolute left-[calc(50%+18vw)] xl:left-[calc(50%+15rem)] top-1/2 -translate-y-1/2 z-30">
        {menus.filter(m => !m.parent_id).map((menu) => (
          <a
            key={menu.id}
            href={menu.path}
            className="relative text-[11px] font-extrabold tracking-[0.3em] text-gold-200/70 hover:text-gold-300 transition-all duration-300 uppercase whitespace-nowrap group hover:-translate-y-0.5"
            style={{ display: 'inline-block', transition: 'color 0.3s, transform 0.3s' }}
          >
            {menu.title}
            <span
              className="absolute left-0 -bottom-1 h-px bg-gradient-to-r from-gold-500 to-gold-300 w-full origin-left"
              style={{ transform: 'scaleX(0)', transition: 'transform 0.35s ease' }}
              ref={(el) => {
                if (!el) return;
                const parent = el.parentElement;
                if (!parent) return;
                parent.addEventListener('mouseenter', () => { el.style.transform = 'scaleX(1)'; });
                parent.addEventListener('mouseleave', () => { el.style.transform = 'scaleX(0)'; });
              }}
            />
          </a>
        ))}
      </div>
    </motion.div>

    {/* Hero Bottom Stats */}
    <div className="w-full max-w-7xl mx-auto px-6 mt-20 relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
        {[
          { title: 'UZMAN KADRO', desc: 'Alanında deneyimli ve uzman avukatlarımızla yanınızdayız.' },
          { title: 'HIZLI ÇÖZÜM', desc: 'Hukuki süreçlerinizi en etkin ve hızlı şekilde sonuçlandırıyoruz.' },
          { title: 'GÜVENİLİR HİZMET', desc: 'Şeffaflık ve güven prensibiyle hukuki danışmanlık sağlıyoruz.' },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 + (i * 0.2) }}
            className="p-6 lg:p-12 text-center rounded-[1.5rem] md:rounded-[2rem] backdrop-blur-sm bg-white/[0.03] border border-gold-500/[0.05] hover:border-gold-500/30 hover:bg-gold-500/5 hover:-translate-y-2 transition-all duration-500 group shadow-2xl"
          >
            <h3 className="text-sm lg:text-lg font-display font-bold text-gold-200 mb-3 tracking-[0.15em] group-hover:text-gold-400 transition-colors uppercase">{card.title}</h3>
            <p className="text-[10px] lg:text-sm text-gold-100/40 leading-relaxed font-light">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const About = ({ section }: { section: any }) => {
  if (!section) return null;
  return (
    <section id="hakkimizda" className="py-[8vw] -mt-6 md:-mt-12 px-6 relative">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-[5vw] items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-gold-500 text-[clamp(8px,0.8vw,12px)] tracking-[0.4em] uppercase font-bold mb-[1vw] block">{section.subtitle}</span>
          <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-display font-bold mb-[2vw] tracking-tight leading-tight" dangerouslySetInnerHTML={{ __html: section.title.replace('\n', '<br/>') }}></h2>
          <div className="text-gold-100/50 leading-relaxed mb-12 text-[clamp(12px,1.1vw,18px)] font-light whitespace-pre-line">
            {section.content}
          </div>
          <button className="btn-gold-action">DAHA FAZLA BİLGİ <ArrowRight className="w-4 h-4" /></button>
        </motion.div>
        {section.image_url && (
          <div className="relative">
            <div className="glass-card p-[1vw] relative z-10">
              <img
                src={section.image_url}
                className="w-full grayscale hover:grayscale-0 transition-all duration-1000 opacity-70 hover:opacity-100"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const ServiceIcon = ({ name }: { name: string }) => {
  const icons: any = { Gavel, Briefcase, Users, Scale, BookOpen, Shield };
  const Icon = icons[name] || Gavel; // Default to Gavel if icon name is not found
  return <Icon size={40} />;
};

const Services = ({ services, settings }: { services: any[], settings: any }) => (
  <section
    id="hizmetlerimiz"
    className="py-[8vw] px-6 relative overflow-hidden"
  >
    {/* Background layer starting lower */}
    {settings?.services_bg_image && (
      <div
        className="absolute bottom-0 left-0 right-0 top-[70vh] z-0"
        style={{
          backgroundImage: `url(${settings.services_bg_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    )}
    {settings?.services_bg_image && (
      <div className="absolute bottom-0 left-0 right-0 top-[70vh] bg-black/65 z-0" />
    )}

    <div className="max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-[5vw]">
        <span className="text-gold-500 text-[clamp(8px,0.8vw,12px)] tracking-[0.4em] uppercase font-bold mb-[1vw] block">UZMANLIK ALANLARIMIZ</span>
        <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-display font-bold mb-[1.5vw] tracking-tight">Hukuki Çözümlerimiz</h2>
        <div className="w-[6vw] max-w-[100px] h-px bg-gold-500 mx-auto"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2vw]">
        {services.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 backdrop-blur-sm border border-gold-500/15 rounded-2xl p-[2.5vw] group hover:border-gold-500/40 hover:bg-white/10 transition-all duration-500 text-center shadow-xl"
          >
            <div className="text-gold-500 mb-6 flex justify-center group-hover:scale-110 transition-transform">
              <ServiceIcon name={s.icon} />
            </div>
            <h3 className="text-lg font-display font-bold text-gold-200 mb-4 tracking-widest uppercase">{s.title}</h3>
            <p className="text-sm text-gold-100/40 leading-relaxed">{s.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Team = ({ lawyers, settings }: { lawyers: any[], settings: any }) => {
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [selected]);

  return (
    <section
      id="avukatlarimiz"
      className="py-[8vw] px-6 relative overflow-hidden"
      style={settings?.team_bg_image ? {
        backgroundImage: `url(${settings.team_bg_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : {}}
    >
      {settings?.team_bg_image && <div className="absolute inset-0 bg-black/60" />}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-[5vw]">
          <span className="text-gold-500 text-[clamp(8px,0.8vw,12px)] tracking-[0.4em] uppercase font-bold mb-[1vw] block">KADROMUZ</span>
          <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-display font-bold mb-[1.5vw] tracking-tight">Ekibimiz</h2>
          <div className="w-[6vw] max-w-[100px] h-px bg-gold-500 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {lawyers.map((lawyer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="group cursor-pointer"
              onClick={() => setSelected(lawyer)}
            >
              <div className="mb-8 relative overflow-hidden aspect-[4/5] rounded-[2.5rem] flex items-center justify-center bg-gold-500/5 transition-all duration-500 group-hover:bg-gold-500/10">
                <img
                  src={lawyer.image_url}
                  alt={lawyer.name}
                  className="w-[94%] h-[94%] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105 rounded-[2.2rem]"
                  loading="lazy"
                />
                <div className="absolute bottom-6 inset-x-8 bg-gradient-to-t from-black/80 to-transparent py-4 px-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-[2rem]">
                  <p className="text-gold-400 text-[10px] font-bold tracking-widest uppercase text-center">Profili Gör →</p>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-display font-bold text-gold-200 mb-2 tracking-widest uppercase">{lawyer.name}</h3>
                <p className="text-gold-500 font-bold text-[10px] tracking-[0.3em] uppercase mb-4">{lawyer.title}</p>
                <p className="text-gold-100/40 text-sm leading-relaxed font-light line-clamp-3">{lawyer.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lawyer Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl max-h-[88vh] flex flex-col lg:flex-row overflow-hidden rounded-3xl shadow-2xl border border-gold-500/20 bg-dark-950"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo */}
            <div className="lg:w-1/2 h-[40vh] lg:h-auto relative overflow-hidden">
              <img
                src={selected.image_url}
                alt={selected.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50 lg:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:hidden" />
            </div>

            {/* Info */}
            <div className="lg:w-1/2 flex flex-col justify-center px-10 lg:px-14 py-10 relative overflow-y-auto">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-gold-400 hover:text-white bg-white/5 hover:bg-white/10 border border-gold-500/20 rounded-full transition-all"
              >
                <X size={18} />
              </button>
              <span className="text-gold-500 text-[10px] tracking-[0.5em] uppercase font-bold mb-4">EKİBİMİZ</span>
              <h2 className="text-3xl lg:text-5xl font-display font-bold text-white mb-3 tracking-wider uppercase leading-tight">
                {selected.name}
              </h2>
              <div className="w-14 h-px bg-gold-500 mb-5" />
              <p className="text-gold-400 font-bold text-sm tracking-[0.3em] uppercase mb-6">{selected.title}</p>
              <p className="text-gold-100/60 leading-relaxed text-sm font-light">{selected.bio}</p>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};


const Contact = ({ settings }: { settings: any }) => (
  <section
    id="iletisim"
    className="py-[8vw] px-6 relative overflow-hidden"
    style={settings?.contact_bg_image ? {
      backgroundImage: `url(${settings.contact_bg_image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    } : {}}
  >
    {settings?.contact_bg_image && (
      <div className="absolute inset-0 bg-black/70" />
    )}
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="grid lg:grid-cols-2 gap-[5vw]">
        <div>
          <span className="text-gold-500 text-[clamp(8px,0.8vw,12px)] tracking-[0.4em] uppercase font-bold mb-[1vw] block">İLETİŞİM</span>
          <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-display font-bold mb-[2.5vw] tracking-tight">Bize Ulaşın</h2>
          <div className="space-y-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 glass-card flex items-center justify-center text-gold-500 shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="text-gold-200 font-display font-bold text-sm tracking-widest uppercase mb-1">ADRES</h4>
                <p className="text-gold-100/40 text-sm leading-relaxed">{settings.contact_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 glass-card flex items-center justify-center text-gold-500 shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h4 className="text-gold-200 font-display font-bold text-sm tracking-widest uppercase mb-1">TELEFON</h4>
                <p className="text-gold-100/40 text-sm leading-relaxed">{settings.contact_phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 glass-card flex items-center justify-center text-gold-500 shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="text-gold-200 font-display font-bold text-sm tracking-widest uppercase mb-1">E-POSTA</h4>
                <p className="text-gold-100/40 text-sm leading-relaxed">{settings.contact_email}</p>
              </div>
            </div>
          </div>
        </div>
        <form className="bg-white/5 backdrop-blur-2xl border border-gold-500/15 p-8 space-y-6 rounded-3xl shadow-xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gold-500 font-bold tracking-widest uppercase">AD SOYAD</label>
              <input type="text" className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none transition-colors rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gold-500 font-bold tracking-widest uppercase">E-POSTA</label>
              <input type="email" className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none transition-colors rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-gold-500 font-bold tracking-widest uppercase">MESAJINIZ</label>
            <textarea rows={4} className="w-full bg-black/40 border border-gold-500/20 p-3 text-gold-100 focus:border-gold-500 outline-none transition-colors resize-none rounded-xl"></textarea>
          </div>
          <button className="btn-gold-action w-full justify-center">MESAJI GÖNDER</button>
        </form>
      </div>
    </div>
  </section>
);

const Footer = ({ settings }: { settings: any }) => (
  <footer className="bg-black/60 backdrop-blur-md py-4 px-6 border-t border-gold-500/10">
    <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
      <img src={settings.site_logo} alt="Logo" className="h-[20vw] md:h-30 max-h-30 mb-[-1.5rem]" loading="lazy" />
      <p className="max-w-lg text-gold-100/30 text-[10px] leading-relaxed mb-4">
        Adaletin tecellisi ve müvekkillerimizin haklarının korunması için profesyonel ve etik değerlere bağlı hukuki hizmet sunuyoruz.
      </p>
      <div className="flex gap-4 mb-4">
        {[
          { Icon: Instagram, link: settings.social_instagram },
          { Icon: Facebook, link: settings.social_facebook },
          { Icon: Twitter, link: settings.social_twitter }
        ].map(({ Icon, link }, i) => (
          <a key={i} href={link} className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-gold-500 hover:text-white transition-all">
            <Icon size={14} />
          </a>
        ))}
      </div>
      <div className="pt-4 w-full flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gold-500/5">
        <p className="text-[9px] text-gold-100/20 tracking-widest uppercase">© 2024 {settings.site_name}.</p>
        <div className="flex flex-wrap justify-center gap-6 text-[9px] text-gold-100/20 tracking-widest uppercase">
          <a href="#" className="hover:text-gold-500 transition-colors">GİZLİLİK</a>
          <a href="#" className="hover:text-gold-500 transition-colors">ŞARTLAR</a>
          <Link to="/admin" className="hover:text-gold-500 transition-colors text-gold-500/40">YÖNETİM</Link>
        </div>
      </div>
    </div>
  </footer>
);

const DynamicPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      fetchPageBySlug(slug).then(setPage);
    }
  }, [slug]);

  if (!page) return <div className="min-h-screen pt-32 text-center text-gold-500">Yükleniyor...</div>;

  return (
    <div
      className="min-h-screen pt-32 md:pt-40 px-4 md:px-6 pb-20 relative"
      style={page.bg_image ? {
        backgroundImage: `url(${page.bg_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll',
      } : {}}
    >
      {page.bg_image && <div className="absolute inset-0 bg-black/70" />}
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-gradient-gold mb-8 md:mb-12 text-center">{page.title}</h1>
        <div className="glass-card p-6 md:p-12 leading-relaxed text-gold-100/70 prose-custom max-w-none" dangerouslySetInnerHTML={{ __html: page.content }}></div>
      </div>
    </div>
  );
};

const HomePage = ({ settings, sections, services, lawyers, menus }: { settings: any, sections: any[], services: any[], lawyers: any[], menus: any[] }) => (
  <>
    <Hero settings={settings} menus={menus} />
    <About section={sections.find(s => s.id === 'about')} />
    <Services services={services} settings={settings} />
    <Team lawyers={lawyers} settings={settings} />
    <Contact settings={settings} />
  </>
);

const defaultSettings = {
  site_name: 'ZEMA HUKUK BÜROSU',
  site_logo: 'https://i.hizliresim.com/gj3qd7x.png',
  contact_address: 'Bahçelievler Mah. Adalet Cad. No: 11 - 20/1 / İstanbul',
  contact_phone: '+90 (212) 300 35 66',
  contact_email: 'bilgi@zemahukuk.com',
  social_instagram: '#',
  social_facebook: '#',
  social_twitter: '#',
  site_bg_image: 'https://i.ibb.co/Y7XzXKd2/arkaplan11.png',
  services_bg_image: '',
  team_bg_image: '',
  contact_bg_image: '',
};

export default function App() {
  const [settings, setSettings] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);

  const activeSettings = settings || defaultSettings;

  useEffect(() => {
    const loadContent = async () => {
      try {
        // First load essential data for the shell
        const [s, m] = await Promise.all([
          fetchSettings(),
          fetchMenus(),
        ]);

        setSettings(s || defaultSettings);
        setMenus(m || []);
        setIsLoading(false); // Show the shell as soon as we have settings and menus

        // Then load the rest of the content in the background
        const [p, sec, ser, law] = await Promise.all([
          fetchPages(),
          fetchSections(),
          fetchServices(),
          fetchLawyers()
        ]);

        setPages(p || []);
        setSections(sec || []);
        setServices(ser || []);
        setLawyers(law || []);
      } catch (error) {
        console.error('App: Error loading data:', error);
        setSettings(defaultSettings);
        setIsLoading(false);
      }
    };
    loadContent();
  }, []);

  useEffect(() => {
    if (activeSettings.site_bg_image) {
      const img = new Image();
      img.src = activeSettings.site_bg_image;
      img.onload = () => {
        setBgLoaded(true);
      };
      img.onerror = () => {
        console.error('App: Background image failed to load');
        setBgLoaded(true); // Still show content if image fails
      };
    } else {
      setBgLoaded(true);
    }
  }, [activeSettings.site_bg_image]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-gold-500 font-display animate-pulse tracking-widest text-2xl uppercase">YÜKLENİYOR...</div>
      </div>
    );
  }

  return (
    <Router>
      <div
        className="min-h-screen relative transition-opacity duration-1000 overflow-x-hidden w-full"
        style={{
          backgroundImage: activeSettings.site_bg_image && bgLoaded ? `url(${activeSettings.site_bg_image})` : 'none',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          backgroundAttachment: 'scroll',
          backgroundColor: '#0a0908',
          opacity: bgLoaded ? 1 : 0.9,
        }}
      >
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/45 z-[1] pointer-events-none" />

        {/* Content Layer */}
        <div className="relative z-10 w-full overflow-x-hidden">
          <Navbar settings={activeSettings} menus={menus} />
          <Routes>
            <Route path="/" element={<HomePage settings={activeSettings} sections={sections} services={services} lawyers={lawyers} menus={menus} />} />
            <Route path="/admin" element={
              <React.Suspense fallback={<div className="min-h-screen bg-dark-950" />}>
                <Admin />
              </React.Suspense>
            } />
            <Route path="/p/:slug" element={<DynamicPage />} />
          </Routes>
          <Footer settings={activeSettings} />
        </div>
      </div>
    </Router>
  );
}
