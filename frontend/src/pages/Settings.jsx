import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  User, 
  Lock, 
  Shield,
  Eye,
  EyeOff,
  Check,
  Plus,
  Pencil,
  Trash2,
  Users,
  KeyRound,
  AlertTriangle
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
  
  // User management state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales_lead'
  });
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [processingUser, setProcessingUser] = useState(false);

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
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to change password');
      }
      
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  // User Management Functions
  const handleCreateUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (newUserData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setProcessingUser(true);
    
    try {
      const response = await fetch(`${API}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUserData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create user');
      }
      
      const createdUser = await response.json();
      setUsers(prev => [...prev, createdUser]);
      setIsCreateDialogOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: 'sales_lead' });
      toast.success('User created successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingUser(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    setProcessingUser(true);
    
    try {
      const response = await fetch(`${API}/auth/users/${selectedUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editUserData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update user');
      }
      
      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.user_id === selectedUser.user_id ? updatedUser : u));
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPassword) return;
    
    if (resetPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setProcessingUser(true);
    
    try {
      const response = await fetch(`${API}/auth/users/${selectedUser.user_id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ new_password: resetPassword })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reset password');
      }
      
      setIsResetPasswordDialogOpen(false);
      setResetPassword('');
      setSelectedUser(null);
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setProcessingUser(true);
    
    try {
      const response = await fetch(`${API}/auth/users/${selectedUser.user_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete user');
      }
      
      setUsers(prev => prev.filter(u => u.user_id !== selectedUser.user_id));
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingUser(false);
    }
  };

  const openEditDialog = (u) => {
    setSelectedUser(u);
    setEditUserData({ name: u.name, email: u.email, role: u.role });
    setIsEditDialogOpen(true);
  };

  const openResetPasswordDialog = (u) => {
    setSelectedUser(u);
    setResetPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const openDeleteDialog = (u) => {
    setSelectedUser(u);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-ocean-900 flex">
        <Sidebar activePage="settings" />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-32"></div>
            <div className="h-64 bg-white/5 rounded-2xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activePage="settings" />
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-2xl font-heading font-semibold text-slate-900">Settings</h1>
            <p className="text-slate-500 mt-1">Manage your account and preferences</p>
          </div>

          {/* Profile Card */}
          <Card className="border-slate-200 shadow-soft" data-testid="profile-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-ocean-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Profile</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 text-sm">Name</Label>
                  <p className="font-medium text-slate-900">{user?.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Email</Label>
                  <p className="font-medium text-slate-900">{user?.email}</p>
                </div>
              </div>
              <div>
                <Label className="text-slate-500 text-sm">Role</Label>
                <div className="mt-1">
                  <Badge className={user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-ocean-100 text-ocean-700'}>
                    {user?.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : null}
                    {user?.role === 'admin' ? 'Administrator' : 'Sales Lead'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="border-slate-200 shadow-soft" data-testid="password-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="current_password"
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="new_password"
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
                  
                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      data-testid="confirm-password-input"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
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
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* User Management - Admin Only */}
          {user?.role === 'admin' && (
            <Card className="border-slate-200 shadow-soft" data-testid="user-management-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">User Management</CardTitle>
                      <CardDescription>Add, edit, and manage team members</CardDescription>
                    </div>
                  </div>
                  
                  {/* Create User Dialog */}
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-user-btn" className="bg-ocean-950 hover:bg-ocean-900 rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            data-testid="new-user-name"
                            value={newUserData.name}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="John Doe"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            data-testid="new-user-email"
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john@compassx.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <div className="relative mt-1">
                            <Input
                              data-testid="new-user-password"
                              type={showNewUserPassword ? 'text' : 'password'}
                              value={newUserData.password}
                              onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Min 8 characters"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={newUserData.role}
                            onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}
                          >
                            <SelectTrigger data-testid="new-user-role" className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales_lead">Sales Lead</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          data-testid="create-user-submit"
                          onClick={handleCreateUser}
                          disabled={processingUser}
                          className="bg-ocean-950 hover:bg-ocean-900"
                        >
                          {processingUser ? 'Creating...' : 'Create User'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No users found</p>
                  ) : (
                    users.map((u) => (
                      <div
                        key={u.user_id}
                        data-testid={`user-row-${u.user_id}`}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            u.role === 'admin' ? 'bg-purple-100' : 'bg-ocean-100'
                          }`}>
                            <span className={`font-medium ${u.role === 'admin' ? 'text-purple-700' : 'text-ocean-700'}`}>
                              {u.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.name}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-ocean-100 text-ocean-700'}>
                            {u.role === 'admin' ? 'Admin' : 'Sales Lead'}
                          </Badge>
                          
                          {u.user_id !== user?.user_id && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`edit-user-${u.user_id}`}
                                onClick={() => openEditDialog(u)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-ocean-600"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`reset-password-${u.user_id}`}
                                onClick={() => openResetPasswordDialog(u)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600"
                              >
                                <KeyRound className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`delete-user-${u.user_id}`}
                                onClick={() => openDeleteDialog(u)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          
                          {u.user_id === user?.user_id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    data-testid="edit-user-name"
                    value={editUserData.name}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    data-testid="edit-user-email"
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={editUserData.role}
                    onValueChange={(value) => setEditUserData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger data-testid="edit-user-role" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_lead">Sales Lead</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  data-testid="edit-user-submit"
                  onClick={handleEditUser}
                  disabled={processingUser}
                  className="bg-ocean-950 hover:bg-ocean-900"
                >
                  {processingUser ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-slate-600 mb-4">
                  Set a new password for <strong>{selectedUser?.name}</strong>
                </p>
                <div>
                  <Label>New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      data-testid="reset-password-input"
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  data-testid="reset-password-submit"
                  onClick={handleResetPassword}
                  disabled={processingUser}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {processingUser ? 'Resetting...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete User Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Delete User
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-slate-600">
                  Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  data-testid="delete-user-confirm"
                  onClick={handleDeleteUser}
                  disabled={processingUser}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {processingUser ? 'Deleting...' : 'Delete User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
