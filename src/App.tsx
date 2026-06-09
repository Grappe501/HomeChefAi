import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './hooks/useApp';
import Layout from './components/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ReceiptScan from './pages/ReceiptScan';
import PantryScan from './pages/PantryScan';
import HostingStudio from './pages/HostingStudio';
import PantryWizard from './pages/PantryWizard';
import MealPlanner from './pages/MealPlanner';
import MealSlotDetail from './pages/MealSlotDetail';
import RecipeIdeas from './pages/RecipeIdeas';
import CookLog from './pages/CookLog';
import Assistant from './pages/Assistant';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import Community from './pages/Community';
import Brain from './pages/Brain';
import ProductJournal from './pages/ProductJournal';
import LoadingScreen from './components/LoadingScreen';
import Landing from './pages/marketing/Landing';
import ExploreIndex from './pages/marketing/ExploreIndex';
import ExploreLayer from './pages/marketing/ExploreLayer';
import ExploreFeature from './pages/marketing/ExploreFeature';
import HowItWorks from './pages/marketing/HowItWorks';
import PricingPage from './pages/marketing/PricingPage';
import StoryPage from './pages/marketing/StoryPage';
import LearnIndex from './pages/marketing/LearnIndex';
import LearnEntry from './pages/marketing/LearnEntry';
import { VisionIndex, VisionTopicPage } from './pages/marketing/VisionPages';
import ErrorBoundary from './components/ErrorBoundary';
import Learn from './pages/Learn';
import LearnDetail from './pages/LearnDetail';
import MarketingNotFound from './pages/marketing/NotFound';

/** Marketing site — always reachable (logged-in users can browse pricing, learn, etc.) */
function MarketingSiteRoutes() {
  return (
    <>
      <Route path="/landing" element={<Landing />} />
      <Route path="/explore" element={<ExploreIndex />} />
      <Route path="/explore/:layerId" element={<ExploreLayer />} />
      <Route path="/explore/:layerId/:featureId" element={<ExploreFeature />} />
      <Route path="/how" element={<HowItWorks />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/story" element={<StoryPage />} />
      <Route path="/vision" element={<VisionIndex />} />
      <Route path="/vision/:topicId" element={<VisionTopicPage />} />
    </>
  );
}

/** Public Kitchen Academy — when logged out or onboarding (logged-in app uses /learn in Layout) */
function MarketingLearnRoutes() {
  return (
    <>
      <Route path="/learn" element={<LearnIndex />} />
      <Route path="/learn/:entryId" element={<LearnEntry />} />
    </>
  );
}

function AuthenticatedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/receipt" element={<ReceiptScan />} />
        <Route path="/pantry-scan" element={<PantryScan />} />
        <Route path="/hosting" element={<HostingStudio />} />
        <Route path="/wizard" element={<PantryWizard />} />
        <Route path="/meals" element={<MealPlanner />} />
        <Route path="/meals/:planId/slot/:slotId" element={<MealSlotDetail />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/cook" element={<CookLog />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/recipes" element={<RecipeIdeas />} />
        <Route path="/community" element={<Community />} />
        <Route path="/brain" element={<Brain />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:entryId" element={<LearnDetail />} />
        <Route path="/admin/journal" element={<ProductJournal />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const { user, profile, loading } = useApp();

  if (loading) return <LoadingScreen />;

  const showPublicLearn = !user || !profile?.onboarding_complete;

  return (
    <ErrorBoundary>
      <Routes>
        {MarketingSiteRoutes()}
        {showPublicLearn && MarketingLearnRoutes()}

        {!user ? (
          <>
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<MarketingNotFound />} />
          </>
        ) : !profile?.onboarding_complete ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Onboarding mode="dietary" />} />
          </>
        ) : (
          <Route path="/*" element={<AuthenticatedRoutes />} />
        )}
      </Routes>
    </ErrorBoundary>
  );
}
