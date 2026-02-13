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
  ChevronRight,
  LineChart
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
    { icon: Building2, label: 'Organizations', path: '/organizations' },
    { icon: Users, label: 'Contacts', path: '/contacts' },
    { icon: Calendar, label: 'Activities', path: '/activities' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  const secondaryItems = [
    { icon: LineChart, label: 'Executive View', path: '/executive' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`
        ${collapsed ? 'w-20' : 'w-64'} 
        h-screen sticky top-0 
        bg-white border-r border-slate-200 
        flex flex-col transition-all duration-300
        shadow-soft
      `}>
        {/* Logo */}
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean-950 rounded-xl flex items-center justify-center flex-shrink-0">
              <Compass className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-heading font-semibold text-ocean-950">CompassX</span>
            )}
          </Link>
          
          <Button
            data-testid="sidebar-collapse-btn"
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1 hover:bg-slate-100 rounded-lg ${collapsed ? 'hidden' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(false)}
            className="mx-auto mb-2 p-1 hover:bg-slate-100 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const NavLink = (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${active 
                    ? 'bg-ocean-950 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {NavLink}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}

          {/* Divider */}
          <div className="my-4 border-t border-slate-200" />

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
                    ? 'bg-ocean-950 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {NavLink}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}
        </nav>

        {/* User Section */}
        <div className={`p-4 border-t border-slate-200 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3'}`}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.picture} />
              <AvatarFallback className="bg-ocean-100 text-ocean-700">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">
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
                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                data-testid="logout-btn"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg"
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
