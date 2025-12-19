
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mic, Library, User, Shield, Video, Home } from 'lucide-react';
import { OwlLogo } from './OwlLogo';

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-gradient-to-r from-tv-teal to-emerald-500 text-white shadow-lg shadow-teal-500/20 font-medium' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

// Mobile Bottom Nav Item
const MobileNavItem = ({ to, icon: Icon, label, active, primary = false }: { to: string, icon: any, label: string, active: boolean, primary?: boolean }) => {
  if (primary) {
    return (
       <Link to={to} className="relative -top-6">
         <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-900/30 border-4 border-white">
           <Icon size={24} className="text-tv-teal" />
         </div>
       </Link>
    );
  }
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-tv-teal' : 'text-slate-400'}`}>
      <Icon size={20} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
};

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col z-10">
        <div className="p-6 pb-8 flex items-center gap-3">
          <OwlLogo size={40} />
          <div>
            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-tv-teal to-tv-coral leading-none">
              ThoughtVoice
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider mt-1 uppercase">Executive Intel</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <NavItem to="/capture" icon={Mic} label="Capture Studio" active={location.pathname === '/capture'} />
          <NavItem to="/library" icon={Library} label="Content Library" active={location.pathname === '/library'} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link to="/profile" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/profile' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <User size={18} />
            <span className="text-sm font-medium">My Profile</span>
          </Link>

          <Link to="/internal" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-600 w-full mt-1">
             <Shield size={18} />
             <span className="text-sm font-medium">Staff Portal</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe z-50 flex justify-between items-center">
         <MobileNavItem to="/" icon={Home} label="Home" active={location.pathname === '/'} />
         <MobileNavItem to="/library" icon={Library} label="Library" active={location.pathname === '/library'} />
         <MobileNavItem to="/capture" icon={Video} label="Record" active={location.pathname === '/capture'} primary />
         <MobileNavItem to="/profile" icon={User} label="Profile" active={location.pathname === '/profile'} />
         <MobileNavItem to="/internal" icon={Shield} label="Staff" active={location.pathname === '/internal'} />
      </div>
    </div>
  );
};
