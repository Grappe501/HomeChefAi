import { NavLink } from 'react-router-dom';
import { Home, Package, Camera, CalendarDays, ChefHat, MessageCircle, Users, Settings } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/inventory', icon: Package, label: 'Pantry' },
  { to: '/receipt', icon: Camera, label: 'Receipt' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/community', icon: Users, label: 'Swap' },
  { to: '/assistant', icon: MessageCircle, label: 'Chef' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useApp();

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      <header className="bg-white border-b border-steel px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-sans font-semibold text-lg text-chef tracking-tight">SousChef</h1>
            <p className="text-xs text-chef-subtle">{profile?.assistant_name || 'Sous Chef'}</p>
          </div>
          <NavLink to="/settings" className="text-steel-dark hover:text-copper-600 p-1">
            <Settings size={20} />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-steel safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-copper-600' : 'text-steel-dark'
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
        className="fixed bottom-20 right-4 w-14 h-14 bg-chef hover:bg-copper-600 text-white rounded-full shadow-lg flex items-center justify-center z-20"
        title="Log a meal"
      >
        <ChefHat size={24} />
      </NavLink>
    </div>
  );
}
