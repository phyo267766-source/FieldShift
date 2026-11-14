import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Leaf, Search, Bell, User, X, Check, Moon, Sun,
  Globe, HelpCircle, Info, Settings, ChevronRight,
  MapPin, FileText, BarChart3, Sprout, GitCompare, ClipboardList,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { searchLocations, searchablePages } from '../data/myanmarLocations';
import { notificationApi } from '../api/client';

const categoryIcons = {
  climate: '🌡️',
  crop: '🌾',
  system: '⚙️',
};

function formatNotificationTime(timestamp) {
  const createdAt = new Date(timestamp);
  if (Number.isNaN(createdAt.getTime())) return '';

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  if (elapsedMinutes < 1) return 'just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes} minute${elapsedMinutes === 1 ? '' : 's'} ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;
  return createdAt.toLocaleString();
}

const navItems = [
  { to: '/', label: 'dashboard', icon: BarChart3 },
  { to: '/my-farm', label: 'myFarm', icon: Sprout },
  { to: '/climate-insights', label: 'climateInsights', icon: Sun },
  { to: '/crop-rotation', label: 'cropRotation', icon: GitCompare },
  { to: '/compare-plans', label: 'comparePlans', icon: ClipboardList },
  { to: '/reports', label: 'reports', icon: FileText },
];

const pageIcons = {
  Dashboard: BarChart3,
  'My Farm': Sprout,
  'Climate Insights': Sun,
  'Crop Rotation': GitCompare,
  'Compare Plans': ClipboardList,
  Reports: FileText,
};

export default function Navbar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  // Dropdown states
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ pages: [], locations: [] });
  const [notifications, setNotifications] = useState([]);

  // Refs for outside click
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const accountRef = useRef(null);
  const searchInputRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const refreshNotifications = useCallback(async () => {
    try {
      const result = await notificationApi.getAll();
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('Could not load FieldShift notifications:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.removeItem('fieldshift_notifications');
    refreshNotifications();
    window.addEventListener('fieldshift:notifications-updated', refreshNotifications);
    const intervalId = window.setInterval(refreshNotifications, 30000);
    return () => {
      window.removeEventListener('fieldshift:notifications-updated', refreshNotifications);
      window.clearInterval(intervalId);
    };
  }, [refreshNotifications]);

  // Close all dropdowns
  const closeAll = useCallback(() => {
    setSearchOpen(false);
    setNotifOpen(false);
    setAccountOpen(false);
  }, []);

  // Outside click handler
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') closeAll();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeAll]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Search handler
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults({ pages: [], locations: [] });
      return;
    }
    const locations = searchLocations(query, 5);
    const lowerQ = query.toLowerCase();
    const pages = searchablePages.filter(p =>
      p.name.toLowerCase().includes(lowerQ) ||
      p.description.toLowerCase().includes(lowerQ)
    ).slice(0, 4);
    setSearchResults({ pages, locations });
  };

  // Select search result
  const handleSelectPage = (path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Notification actions
  const markAllRead = async () => {
    try {
      const result = await notificationApi.markAllRead();
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('Could not mark FieldShift notifications as read:', error);
    }
  };

  const dismissNotification = async (id) => {
    try {
      await notificationApi.dismiss(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Could not dismiss FieldShift notification:', error);
    }
  };

  const markRead = async (id) => {
    try {
      const result = await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? result.notification : n));
    } catch (error) {
      console.error('Could not mark FieldShift notification as read:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-forest dark:bg-brand-500 rounded-full flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-forest dark:text-brand-300 hidden sm:block">
              FieldShift
            </span>
          </NavLink>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium px-3 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-forest dark:text-brand-300 border-forest dark:border-brand-300'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                  }`
                }
              >
                {t(label)}
              </NavLink>
            ))}
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <button
                onClick={() => { closeAll(); setSearchOpen(!searchOpen); }}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full mt-1 w-[340px] sm:w-[400px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-50">
                  {/* Search input */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={t('search') + '...'}
                      className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                    {searchQuery && (
                      <button onClick={() => { setSearchQuery(''); setSearchResults({ pages: [], locations: [] }); }}>
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Results */}
                  <div className="max-h-[320px] overflow-y-auto">
                    {searchQuery.length < 2 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-400 dark:text-gray-500">Type to search pages and locations</p>
                      </div>
                    ) : (
                      <>
                        {/* Pages */}
                        {searchResults.pages.length > 0 && (
                          <div className="px-3 pt-3 pb-1">
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1 mb-1">Pages & Features</p>
                            {searchResults.pages.map((page, i) => {
                              const Icon = pageIcons[page.name] || FileText;
                              return (
                                <button
                                  key={i}
                                  onClick={() => handleSelectPage(page.path)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3"
                                >
                                  <Icon className="w-4 h-4 text-forest dark:text-brand-300 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{page.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{page.description}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Locations */}
                        {searchResults.locations.length > 0 && (
                          <div className="px-3 pt-2 pb-2">
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1 mb-1">Myanmar Locations</p>
                            {searchResults.locations.map((loc, i) => (
                              <button
                                key={i}
                                onClick={() => { handleSelectPage('/my-farm'); setSearchOpen(false); }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3"
                              >
                                <MapPin className="w-4 h-4 text-forest dark:text-brand-300 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{loc.name}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {loc.nameMm && `${loc.nameMm} • `}{loc.parent || loc.type}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.pages.length === 0 && searchResults.locations.length === 0 && (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('noResults')}</p>
                            <p className="text-xs text-gray-400 mt-1">{t('tryDifferent')}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { closeAll(); setNotifOpen(!notifOpen); }}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-[340px] sm:w-[380px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('notifications')}</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-forest dark:text-brand-300 font-medium hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {t('markAllRead')}
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('noNotifications')}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('allCaughtUp')}</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          }`}
                          onClick={() => markRead(n.id)}
                        >
                          <span className="text-lg shrink-0 mt-0.5">{categoryIcons[n.category] || '📌'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-gray-100`}>
                                {n.title}
                              </p>
                              <button
                                onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{formatNotificationTime(n.time)}</p>
                          </div>
                          {!n.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => { closeAll(); setAccountOpen(!accountOpen); }}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-olive-light dark:bg-brand-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-olive dark:text-brand-300" />
                </div>
                <span className="hidden lg:block">{t('account')}</span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-1 w-[260px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {(() => { try { const p = JSON.parse(localStorage.getItem('fieldshift_profile') || '{}'); return p.fullName || t('guestUser'); } catch { return t('guestUser'); } })()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {(() => { try { const p = JSON.parse(localStorage.getItem('fieldshift_profile') || '{}'); return p.role || 'Farmer'; } catch { return 'Farmer'; } })()}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {/* Profile */}
                    <button
                      onClick={() => { navigate('/account'); setAccountOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      {t('profileInfo')}
                    </button>

                    {/* Settings */}
                    <button
                      onClick={() => { navigate('/settings'); setAccountOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      {t('accountSettings')}
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                    {/* Language toggle */}
                    <button
                      onClick={() => setLang(lang === 'en' ? 'mm' : 'en')}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        {t('languagePreferences')}
                      </span>
                      <span className="text-xs text-forest dark:text-brand-300 font-medium">
                        {lang === 'en' ? 'EN' : 'MM'}
                      </span>
                    </button>

                    {/* Theme toggle */}
                    <button
                      onClick={toggleTheme}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex items-center gap-3">
                        {isDark ? <Sun className="w-4 h-4 text-gray-400" /> : <Moon className="w-4 h-4 text-gray-400" />}
                        {isDark ? t('lightMode') : t('darkMode')}
                      </span>
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${isDark ? 'bg-brand-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                    {/* Help */}
                    <button
                      onClick={() => { navigate('/help'); setAccountOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                      {t('helpSupport')}
                    </button>

                    {/* About */}
                    <button
                      onClick={() => { navigate('/about'); setAccountOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <Info className="w-4 h-4 text-gray-400" />
                      {t('aboutFieldshift')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-forest dark:bg-brand-500 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              {t(label)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
