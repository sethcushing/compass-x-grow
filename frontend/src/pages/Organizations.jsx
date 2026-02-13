import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search,
  Building2,
  MapPin,
  Users,
  Briefcase,
  User,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    industry: '',
    company_size: '',
    region: '',
    strategic_tier: 'Current',
    owner_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgsRes, usersRes] = await Promise.all([
        fetch(`${API}/organizations`, { credentials: 'include' }),
        fetch(`${API}/auth/users`, { credentials: 'include' })
      ]);
      
      const orgsData = await orgsRes.json();
      setOrganizations(orgsData);
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrg.name) {
      toast.error('Client name is required');
      return;
    }
    if (!newOrg.owner_id) {
      toast.error('Please select an owner');
      return;
    }

    try {
      const response = await fetch(`${API}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newOrg)
      });

      if (!response.ok) throw new Error('Failed to create');

      const created = await response.json();
      setOrganizations(prev => [...prev, created]);
      setIsDialogOpen(false);
      setNewOrg({
        name: '',
        industry: '',
        company_size: '',
        region: '',
        strategic_tier: 'Current',
        owner_id: '',
        notes: ''
      });
      toast.success('Client created');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Current': return 'bg-emerald-100 text-emerald-700';
      case 'Future': return 'bg-ocean-100 text-ocean-700';
      case 'Return': return 'bg-amber-100 text-amber-700';
      // Legacy values mapping
      case 'Strategic': return 'bg-emerald-100 text-emerald-700';
      case 'Target': return 'bg-ocean-100 text-ocean-700';
      case 'Active': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    // Map legacy values to new values
    switch (status) {
      case 'Strategic': return 'Current';
      case 'Target': return 'Future';
      case 'Active': return 'Return';
      default: return status;
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.user_id === userId);
    return user?.name || 'Unassigned';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
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
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-heading font-semibold text-slate-900">Clients</h1>
              <p className="text-slate-500 mt-1">Manage your client accounts</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-org-btn" className="bg-ocean-950 hover:bg-ocean-900 rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading">Add Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="org-name">Client Name *</Label>
                    <Input
                      id="org-name"
                      data-testid="org-name-input"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Acme Corporation"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="org-industry">Industry</Label>
                      <Select
                        value={newOrg.industry}
                        onValueChange={(value) => setNewOrg(prev => ({ ...prev, industry: value }))}
                      >
                        <SelectTrigger data-testid="org-industry-select" className="mt-1">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Financial Services">Financial Services</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Energy">Energy</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="org-size">Company Size</Label>
                      <Select
                        value={newOrg.company_size}
                        onValueChange={(value) => setNewOrg(prev => ({ ...prev, company_size: value }))}
                      >
                        <SelectTrigger data-testid="org-size-select" className="mt-1">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Startup">Startup</SelectItem>
                          <SelectItem value="SMB">SMB</SelectItem>
                          <SelectItem value="Mid-Market">Mid-Market</SelectItem>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="org-region">Region</Label>
                      <Select
                        value={newOrg.region}
                        onValueChange={(value) => setNewOrg(prev => ({ ...prev, region: value }))}
                      >
                        <SelectTrigger data-testid="org-region-select" className="mt-1">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="North America">North America</SelectItem>
                          <SelectItem value="Europe">Europe</SelectItem>
                          <SelectItem value="APAC">APAC</SelectItem>
                          <SelectItem value="LATAM">LATAM</SelectItem>
                          <SelectItem value="MEA">MEA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="org-status">Client Status</Label>
                      <Select
                        value={newOrg.strategic_tier}
                        onValueChange={(value) => setNewOrg(prev => ({ ...prev, strategic_tier: value }))}
                      >
                        <SelectTrigger data-testid="org-status-select" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Current">Current</SelectItem>
                          <SelectItem value="Future">Future</SelectItem>
                          <SelectItem value="Return">Return</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="org-owner">Owner *</Label>
                    <Select
                      value={newOrg.owner_id}
                      onValueChange={(value) => setNewOrg(prev => ({ ...prev, owner_id: value }))}
                    >
                      <SelectTrigger data-testid="org-owner-select" className="mt-1">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="org-notes">Notes</Label>
                    <Textarea
                      id="org-notes"
                      value={newOrg.notes}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this client..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    data-testid="submit-org-btn"
                    onClick={handleCreateOrg}
                    className="w-full bg-ocean-950 hover:bg-ocean-900 rounded-full"
                  >
                    Add Client
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              data-testid="search-clients"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-slate-200"
            />
          </div>

          {/* Client Grid */}
          {filteredOrgs.length === 0 ? (
            <Card className="border-slate-200 shadow-soft">
              <CardContent className="py-16 text-center">
                <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-heading font-medium text-slate-900">No clients yet</h3>
                <p className="text-slate-500 mt-1">Add your first client to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrgs.map((org) => (
                <Link key={org.org_id} to={`/organizations/${org.org_id}`}>
                  <Card className="border-slate-200 shadow-soft hover:shadow-md hover:border-ocean-300 transition-all cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-ocean-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-ocean-600" />
                          </div>
                          <div>
                            <h3 className="font-heading font-semibold text-slate-900">{org.name}</h3>
                            <p className="text-sm text-slate-500">{org.industry || 'No industry'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={getStatusColor(org.strategic_tier)}>
                            {getStatusLabel(org.strategic_tier)}
                          </Badge>
                          {org.is_at_risk && (
                            <Badge className="bg-rose-100 text-rose-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              At Risk
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="w-4 h-4" />
                          <span>{org.region || 'No region'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users className="w-4 h-4" />
                          <span>{org.company_size || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                        <User className="w-4 h-4" />
                        <span>{getUserName(org.owner_id)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Organizations;
