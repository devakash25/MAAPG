import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/helpers';
import {
  Home, Search, Heart, Calendar, MessageCircle, Star, CreditCard,
  Bell, MapPin, User, Settings, LogOut, Menu, X,
  Building2, ArrowLeftRight, Bookmark, Scale
} from 'lucide-react';

const navItems = [
  { to: '/buyer', icon: Home, label: 'Home', end: true },
  { to: '/buyer/explore', icon: Search, label: 'Explore' },
  { to: '/buyer/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/buyer/compare', icon: Scale, label: 'Compare' },
  { to: '/buyer/bookings', icon: Calendar, label: 'My Bookings' },
  { to: '/buyer/enquiries', icon: MessageCircle, label: 'My Enquiries' },
  { to: '/buyer/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/buyer/reviews', icon: Star, label: 'My Reviews' },
  { to: '/buyer/payments', icon: CreditCard, label: 'Payments' },
  { to: '/buyer/notifications', icon: Bell, label: 'Notifications' },
  { to: '/buyer/saved-searches', icon: Bookmark, label: 'Saved Searches' },
  { to: '/buyer/locations', icon: MapPin, label: 'Saved Locations' },
];

const bottomItems = [
  { to: '/buyer/profile', icon: User, label: 'Profile' },
  { to: '/buyer/settings', icon: Settings, label: 'Settings' },
];

export default function BuyerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOwnerApproved = user?.dealer?.status === 'APPROVED';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0a1628] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform lg:transition-none duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <NavLink to="/buyer" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0f2557] to-[#0ea5e9] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-[#0f172a] dark:text-white">MAAPG</span>
          </NavLink>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Items */}
        <div className="border-t border-gray-200 dark:border-gray-800 py-3 px-3 space-y-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          {/* Become Owner / Switch Mode */}
          {isOwnerApproved ? (
            <NavLink
              to="/owner"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <ArrowLeftRight size={18} />
              Switch to Owner
            </NavLink>
          ) : (
            <NavLink
              to="/buyer/become-owner"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              )}
            >
              <Building2 size={18} />
              Become an Owner
            </NavLink>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-[#0a1628] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-[#0f172a] dark:text-white capitalize">
              {location.pathname === '/buyer' ? 'Home' : location.pathname.split('/').pop()?.replace(/-/g, ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <NavLink to="/buyer/notifications" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative">
              <Bell size={20} className="text-gray-500" />
            </NavLink>
            <NavLink to="/buyer/wishlist" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <Heart size={20} className="text-gray-500" />
            </NavLink>
            <NavLink to="/buyer/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
