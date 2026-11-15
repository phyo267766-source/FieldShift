import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const faqs = [
  {
    q: 'How do I add a new farm?',
    a: 'Go to My Farm and click "Add New Farm". Fill in the farm name, location, and soil details, then save.',
  },
  {
    q: 'Where does the weather data come from?',
    a: 'Current weather and forecasts are powered by the Meteomatics Weather API. Historical climate data comes from NASA POWER, which provides satellite-based observations.',
  },
  {
    q: 'How does crop rotation work?',
    a: 'FieldShift analyzes your soil type, climate, previous crops, and growing conditions to recommend evidence-based crop rotation plans. Each recommendation includes a confidence level and suitability score.',
  },
  {
    q: 'Can I manage multiple farms?',
    a: 'Yes! FieldShift supports multiple farms. Each farm maintains its own weather data, climate history, and crop rotation plans. Use the farm switcher in the dashboard to switch between farms.',
  },
  {
    q: 'How often is weather data updated?',
    a: 'Weather data auto-refreshes every 30 minutes by default. You can change this interval in Settings or manually refresh at any time.',
  },
  {
    q: 'What Myanmar regions are supported?',
    a: 'FieldShift covers all 7 States, 7 Regions, and Naypyidaw Union Territory. The location system includes Districts and Townships with GPS coordinates for accurate weather data.',
  },
  {
    q: 'Is my data secure?',
    a: 'All API credentials are stored securely on the backend server. Your farm data is stored locally and never shared with third parties.',
  },
];

export default function HelpSupport() {
  const { darkMode } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = idx => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Help &amp; Support</h1>
        <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Find answers to common questions about FieldShift.
        </p>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === i && (
                  <div className={`px-5 pb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
