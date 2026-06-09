import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './hooks/useApp';
import Layout from './components/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ReceiptScan from './pages/ReceiptScan';
import PantryWizard from './pages/PantryWizard';
import MealPlanner from './pages/MealPlanner';
import CookLog from './pages/CookLog';
import Assistant from './pages/Assistant';
import Settings from './pages/Settings';
import Recipes from './pages/Recipes';
import Calendar from './pages/Calendar';
import Community from './pages/Community';
import Brain from './pages/Brain';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const { user, profile, loading } = useApp();

  if (loading) return <LoadingScreen />;

  if (!user) return <Login />;

  if (!profile?.onboarding_complete) {
    return <Onboarding mode="dietary" />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/receipt" element={<ReceiptScan />} />
        <Route path="/wizard" element={<PantryWizard />} />
        <Route path="/meals" element={<MealPlanner />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/cook" element={<CookLog />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/community" element={<Community />} />
        <Route path="/brain" element={<Brain />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
