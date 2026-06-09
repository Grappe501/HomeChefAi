import { NavLink } from 'react-router-dom';
import { Home, Package, Camera, CalendarDays, ChefHat, MessageCircle, Users, Settings } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { sousChefLabel } from '@/lib/assistant';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/receipt', icon: Camera, label: 'Receipt' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/community', icon: Users, label: 'Swap' },
  { to: '/assistant', icon: MessageCircle, label: 'Clara' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useApp();

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      <header className="bg-white border-b border-steel px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-sans font-semibold text-lg text-chef tracking-tight">SousChef</h1>
            <p className="text-xs text-chef-subtle">{sousChefLabel(profile?.assistant_name)}</p>
          </div>
          <NavLink to="/settings" className="btn-icon text-steel-dark hover:text-chef hover:bg-stainless-100">
            <Settings size={20} />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-steel safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around py-2 px-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-colors min-w-[52px] min-h-[52px] ${
                  isActive ? 'text-chef font-semibold' : 'text-steel-dark'
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
        className="fixed bottom-20 right-4 btn-icon bg-chef hover:bg-chef-muted text-white rounded-full shadow-lg z-20"
        title="Log a meal"
      >
        <ChefHat size={24} />
      </NavLink>
    </div>
  );
}
