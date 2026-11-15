import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function About() {
  const { isDark } = useTheme();
  const cardClass = `rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 text-white text-3xl mb-4">
            🌾
          </div>
          <h1 className="text-3xl font-bold mb-2">FieldShift</h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Smart Agricultural Intelligence for Myanmar Farmers
          </p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Version 2.0.0</p>
        </div>

        {/* Mission */}
        <div className={`${cardClass} mb-6`}>
          <h2 className="text-lg font-semibold mb-3">Our Mission</h2>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            FieldShift empowers Myanmar's farming communities with accessible, data-driven agricultural
            intelligence. By combining satellite climate observations, real-time weather forecasting, and
            evidence-based crop rotation science, we help farmers make informed decisions that improve
            yields, protect soil health, and build resilience against climate change.
          </p>
        </div>

        {/* Data Sources */}
        <div className={`${cardClass} mb-6`}>
          <h2 className="text-lg font-semibold mb-4">Data Sources</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-blue-500 text-lg">🛰️</span>
              </div>
              <div>
                <p className="font-medium">NASA POWER</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Historical climate observations from satellite data (2001–present). Provides
                  temperature, rainfall, humidity, solar radiation, and wind data for any location.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="text-green-500 text-lg">🌤️</span>
              </div>
              <div>
                <p className="font-medium">Meteomatics Weather API</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Real-time weather conditions and multi-day forecasts. Provides current temperature,
                  humidity, precipitation probability, wind speed, and hourly/daily forecasts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className={`${cardClass} mb-6`}>
          <h2 className="text-lg font-semibold mb-4">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '🏡', text: 'Multi-Farm Management' },
              { icon: '📍', text: 'Myanmar Location System' },
              { icon: '🌧️', text: 'Real-Time Weather' },
              { icon: '📊', text: 'Historical Climate Analysis' },
              { icon: '🔄', text: 'Smart Crop Rotation' },
              { icon: '📋', text: 'Farm Reports' },
            ].map((feat, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
              >
                <span className="text-xl">{feat.icon}</span>
                <span className="text-sm font-medium">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Built For */}
        <div className={`${cardClass} mb-6`}>
          <h2 className="text-lg font-semibold mb-3">Built for NASA Space Apps Challenge</h2>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            FieldShift was developed as part of the NASA International Space Apps Challenge, the world's
            largest annual global hackathon. Our project addresses the challenge of leveraging NASA's open
            data to support sustainable agriculture in developing regions.
          </p>
        </div>

        {/* Tech Stack */}
        <div className={`${cardClass}`}>
          <h2 className="text-lg font-semibold mb-4">Technology</h2>
          <div className="flex flex-wrap gap-2">
            {['React', 'Vite', 'Tailwind CSS', 'Flask', 'Python', 'SQLite', 'NASA POWER API', 'Meteomatics API', 'Recharts', 'Leaflet'].map(tech => (
              <span
                key={tech}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
