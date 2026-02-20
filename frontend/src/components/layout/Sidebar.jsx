import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  LayoutDashboard, 
  Kanban, 
  Building2, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Kanban, label: 'Pipeline', path: '/pipeline' },
    { icon: Building2, label: 'Clients', path: '/organizations' },
    { icon: Users, label: 'Contacts', path: '/contacts' },
    { icon: Calendar, label: 'Activities', path: '/activities' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  const secondaryItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`
        ${collapsed ? 'w-20' : 'w-64'} 
        h-screen sticky top-0 
        bg-slate-900/50 backdrop-blur-xl border-r border-white/10
        flex flex-col transition-all duration-300
      `}>
        {/* Logo */}
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-secondary to-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-secondary/20">
              <Compass className="w-6 h-6 text-slate-900" />
            </div>
            {!collapsed && (
              <div>
                <span className="text-lg font-bold text-white">Compass X</span>
                <span className="block text-xs text-secondary font-medium -mt-1">Grow</span>
              </div>
            )}
          </Link>
          
          <Button
            data-testid="sidebar-collapse-btn"
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white ${collapsed ? 'hidden' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(false)}
            className="mx-auto mb-2 p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const testId = `nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`;
            const NavLink = (
              <Link
                key={item.path}
                to={item.path}
                data-testid={testId}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-secondary/20 to-yellow-400/10 text-white border border-secondary/30' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-secondary' : ''}`} />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {NavLink}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}

          {/* Divider */}
          <div className="my-4 border-t border-white/10" />

          {/* Secondary Items */}
          {secondaryItems.map((item) => {
            const active = isActive(item.path);
            const NavLink = (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-secondary/20 to-yellow-400/10 text-white border border-secondary/30' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-secondary' : ''}`} />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {NavLink}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}
        </nav>

        {/* User Section */}
        <div className={`p-4 border-t border-white/10 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3'}`}>
            <Avatar className="w-10 h-10 ring-2 ring-white/20">
              <AvatarImage src={user?.picture} />
              <AvatarFallback className="bg-gradient-to-br from-secondary to-yellow-400 text-slate-900 font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-white/50 truncate capitalize">
                  {user?.role?.replace('_', ' ') || 'Sales Lead'}
                </p>
              </div>
            )}
            
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    data-testid="logout-btn"
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">Logout</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                data-testid="logout-btn"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
