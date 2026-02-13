import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Lock, 
  Shield,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch(`${API}/auth/me`, { credentials: 'include' });
      const userData = await userRes.json();
      setUser(userData);
      
      // If admin, fetch all users
      if (userData.role === 'admin') {
        const usersRes = await fetch(`${API}/auth/users`, { credentials: 'include' });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const response = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }
      
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-amber-100 text-amber-700';
      case 'sales_lead': return 'bg-ocean-100 text-ocean-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-semibold text-slate-900">Settings</h1>
            <p className="text-slate-500 mt-1">Manage your account settings</p>
          </div>

          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-ocean-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-ocean-700">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{user?.name}</h3>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <Badge className={`mt-2 ${getRoleColor(user?.role)}`}>
                      {user?.role === 'admin' ? 'Admin' : 'Sales Lead'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        data-testid="current-password-input"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        data-testid="new-password-input"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      data-testid="confirm-password-input"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    data-testid="change-password-btn"
                    disabled={changingPassword}
                    className="bg-ocean-950 hover:bg-ocean-900 rounded-full"
                  >
                    {changingPassword ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Team Members (Admin Only) */}
            {user?.role === 'admin' && users.length > 0 && (
              <Card className="border-slate-200 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>Users with access to CompassX CRM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.map(u => (
                      <div
                        key={u.user_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-ocean-100 rounded-full flex items-center justify-center">
                            <span className="font-medium text-ocean-700">
                              {u.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.name}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        <Badge className={getRoleColor(u.role)}>
                          {u.role === 'admin' ? 'Admin' : 'Sales Lead'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
