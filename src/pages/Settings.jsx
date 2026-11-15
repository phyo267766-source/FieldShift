import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [settings, setSettings] = useState({
    autoRefreshWeather: true,
    refreshInterval: 30,
    temperatureUnit: 'celsius',
    distanceUnit: 'metric',
    showNotifications: true,
    emailAlerts: false,
    dataRetention: '1year',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fieldshift_settings');
    if (stored) {
      try { setSettings(prev => ({ ...prev, ...JSON.parse(stored) })); } catch {}
    }
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('fieldshift_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sectionClass = `rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`;
  const labelClass = `block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`;
  const selectClass = `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Appearance */}
        <div className={`${sectionClass} mb-6`}>
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Dark Mode</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Toggle dark theme</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <div>
            <label className={labelClass}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className={selectClass}>
              <option value="en">English</option>
              <option value="my">Myanmar (မြန်မာ)</option>
            </select>
          </div>
        </div>

        {/* Weather & Data */}
        <div className={`${sectionClass} mb-6`}>
          <h2 className="text-lg font-semibold mb-4">Weather &amp; Data</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Auto-Refresh Weather</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Automatically update weather data</p>
            </div>
            <button
              onClick={() => handleChange('autoRefreshWeather', !settings.autoRefreshWeather)}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.autoRefreshWeather ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoRefreshWeather ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          {settings.autoRefreshWeather && (
            <div className="mb-4">
              <label className={labelClass}>Refresh Interval (minutes)</label>
              <select value={settings.refreshInterval} onChange={e => handleChange('refreshInterval', Number(e.target.value))} className={selectClass}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          )}
          <div className="mb-4">
            <label className={labelClass}>Temperature Unit</label>
            <select value={settings.temperatureUnit} onChange={e => handleChange('temperatureUnit', e.target.value)} className={selectClass}>
              <option value="celsius">Celsius (°C)</option>
              <option value="fahrenheit">Fahrenheit (°F)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Distance Unit</label>
            <select value={settings.distanceUnit} onChange={e => handleChange('distanceUnit', e.target.value)} className={selectClass}>
              <option value="metric">Metric (km)</option>
              <option value="imperial">Imperial (mi)</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className={`${sectionClass} mb-6`}>
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>In-App Notifications</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Show weather alerts and farm updates</p>
            </div>
            <button
              onClick={() => handleChange('showNotifications', !settings.showNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.showNotifications ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.showNotifications ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Email Alerts</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Receive critical weather alerts by email</p>
            </div>
            <button
              onClick={() => handleChange('emailAlerts', !settings.emailAlerts)}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.emailAlerts ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailAlerts ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className={`${sectionClass} mb-6`}>
          <h2 className="text-lg font-semibold mb-4">Data Management</h2>
          <div>
            <label className={labelClass}>Data Retention</label>
            <select value={settings.dataRetention} onChange={e => handleChange('dataRetention', e.target.value)} className={selectClass}>
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
              <option value="2years">2 Years</option>
              <option value="forever">Keep Forever</option>
            </select>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-lg font-medium text-white transition-colors ${
              saved ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
