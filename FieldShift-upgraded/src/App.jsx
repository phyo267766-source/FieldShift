import { Routes, Route } from 'react-router-dom';
import { LocationProvider } from './contexts/LocationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { FarmProvider } from './contexts/FarmContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import Dashboard from './pages/Dashboard';
import MyFarm from './pages/MyFarm';
import ClimateInsights from './pages/ClimateInsights';
import CropRotation from './pages/CropRotation';
import ComparePlans from './pages/ComparePlans';
import Reports from './pages/Reports';
import Account from './pages/Account';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';
import About from './pages/About';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LocationProvider>
          <FarmProvider>
            <div className="min-h-screen flex flex-col bg-cream dark:bg-slate-900 transition-colors">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/my-farm" element={<MyFarm />} />
                  <Route path="/climate-insights" element={<ClimateInsights />} />
                  <Route path="/crop-rotation" element={<CropRotation />} />
                  <Route path="/compare-plans" element={<ComparePlans />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<HelpSupport />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </main>
              <Footer />
              <ChatBot />
            </div>
          </FarmProvider>
        </LocationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
