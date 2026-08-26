import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn, getInitials } from '@/utils/helpers';
import {
  LayoutDashboard, Home, Bed, Calendar, MessageCircle, DollarSign,
  BarChart3, Star, Tag, FileText, Bell, Settings, LogOut,
  Search, Menu, X, ChevronLeft, AlertCircle, HelpCircle, PlusCircle, User
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', path: '/owner', icon: LayoutDashboard },
  { label: 'divider', path: '', icon: null },
  { label: 'My Properties', path: '/owner/properties', icon: Home },
  { label: 'Add Property', path: '/owner/properties/add', icon: PlusCircle },
  { label: 'divider', path: '', icon: null },
  { label: 'Rooms & Inventory', path: '/owner/inventory', icon: Bed },
  { label: 'Bookings', path: '/owner/bookings', icon: Calendar },
  { label: 'Enquiries', path: '/owner/enquiries', icon: MessageCircle },
  { label: 'divider', path: '', icon: null },
  { label: 'Finance', path: '/owner/finance', icon: DollarSign },
  { label: 'Analytics', path: '/owner/analytics', icon: BarChart3 },
  { label: 'Reviews', path: '/owner/reviews', icon: Star },
  { label: 'Offers', path: '/owner/offers', icon: Tag },
  { label: 'divider', path: '', icon: null },
  { label: 'Documents', path: '/owner/documents', icon: FileText },
  { label: 'Notifications', path: '/owner/notifications', icon: Bell },
  { label: 'Help & Support', path: '/owner/support', icon: HelpCircle },
  { label: 'Settings', path: '/owner/settings', icon: Settings },
  { label: 'divider', path: '', icon: null },
  { label: 'My Profile', path: '/owner/profile', icon: User },
];

export default function OwnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-sky-800/30 flex-shrink-0">
        {(!collapsed || mobileSidebarOpen) && (
          <span className="text-xl font-bold text-sky-300">MAAPG</span>
        )}
        <button
          onClick={() => mobileSidebarOpen ? setMobileSidebarOpen(false) : setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-sky-800/30 text-sky-300 transition-colors"
        >
          {mobileSidebarOpen ? <X size={20} /> : sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scrollbar">
        {menuItems.map((item, index) => {
          if (item.label === 'divider') {
            return <div key={index} className="my-3 border-t border-sky-800/30" />;
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200',
                isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-sky-200/70 hover:bg-sky-800/30 hover:text-white'
              )}
              title={collapsed && !mobileSidebarOpen ? item.label : undefined}
            >
              {Icon && <Icon size={20} className={isActive ? 'text-white' : ''} />}
              {(!collapsed || mobileSidebarOpen) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sky-800/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {getInitials(user?.firstName || 'O', user?.lastName || '')}
          </div>
          {(!collapsed || mobileSidebarOpen) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-sky-300/70">Owner</p>
            </div>
          )}
          {(!collapsed || mobileSidebarOpen) && (
            <button onClick={handleLogout} className="p-2 text-sky-300/50 hover:text-red-400 rounded-lg hover:bg-sky-800/30 transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className={cn('flex h-screen overflow-hidden', theme === 'dark' ? 'bg-[#0b1120]' : 'bg-sky-50')}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex bg-gradient-to-b from-[#0f172a] to-[#1e293b] border-r border-sky-800/20 transition-all duration-300 flex-col flex-shrink-0',
        sidebarOpen ? 'w-64' : 'w-20'
      )}>
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-[#0f172a] to-[#1e293b] w-72 transform transition-transform duration-300 lg:hidden flex flex-col',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className={cn(
          'h-16 border-b flex items-center justify-between px-4 md:px-6 flex-shrink-0 transition-colors',
          theme === 'dark' ? 'bg-[#111827] border-sky-800/20' : 'bg-white border-sky-200'
        )}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={cn('p-2 rounded-lg lg:hidden transition-colors', theme === 'dark' ? 'hover:bg-sky-800/30 text-sky-300' : 'hover:bg-sky-100 text-sky-700')}
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className={cn(
                  'pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 w-48 md:w-64 transition-all',
                  theme === 'dark'
                    ? 'bg-[#1e293b] border-sky-800/30 text-white placeholder-sky-400 focus:border-sky-500'
                    : 'bg-sky-50 border-sky-200 text-gray-900 placeholder-sky-400 focus:border-sky-500'
                )}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button className={cn(
              'relative p-2 rounded-lg transition-colors',
              theme === 'dark' ? 'text-sky-400 hover:text-sky-300 hover:bg-sky-800/30' : 'text-sky-500 hover:text-sky-700 hover:bg-sky-100'
            )}>
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <div className={cn('hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg', theme === 'dark' ? 'bg-sky-900/30' : 'bg-sky-50')}>
              <AlertCircle size={16} className="text-sky-500" />
              <span className={cn('text-sm font-medium', theme === 'dark' ? 'text-sky-300' : 'text-sky-700')}>Owner Panel</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
