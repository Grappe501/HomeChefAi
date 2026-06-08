import { NavLink } from 'react-router-dom';
import { Home, Package, Camera, Wand2, CalendarDays, ChefHat, MessageCircle } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { getLevelInfo } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/inventory', icon: Package, label: 'Pantry' },
  { to: '/receipt', icon: Camera, label: 'Receipt' },
  { to: '/meals', icon: CalendarDays, label: 'Meals' },
  { to: '/assistant', icon: MessageCircle, label: 'Chef' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useApp();
  const levelInfo = profile ? getLevelInfo(profile.gamification_xp, profile.gamification_level) : null;

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      <header className="bg-white border-b border-sage-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg text-chef-700">HomeChef AI</h1>
            <p className="text-xs text-sage-500">{profile?.assistant_name || 'Sous Chef'}</p>
          </div>
          {levelInfo && (
            <div className="text-right">
              <span className="text-xs font-semibold text-chef-600">Lv.{profile!.gamification_level}</span>
              <div className="w-20 h-1.5 bg-sage-100 rounded-full mt-1">
                <div className="h-full bg-chef-400 rounded-full transition-all" style={{ width: `${levelInfo.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-sage-100 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-chef-600' : 'text-sage-400'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <NavLink
        to="/cook"
        className="fixed bottom-20 right-4 w-14 h-14 bg-chef-500 hover:bg-chef-600 text-white rounded-full shadow-lg flex items-center justify-center z-20"
        title="Log a meal"
      >
        <ChefHat size={24} />
      </NavLink>
    </div>
  );
}
