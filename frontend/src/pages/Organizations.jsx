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
  User
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
    strategic_tier: 'Active',
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
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrg.name) {
      toast.error('Organization name is required');
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
        strategic_tier: 'Active',
        owner_id: '',
        notes: ''
      });
      toast.success('Organization created');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Strategic': return 'bg-amber-100 text-amber-700';
      case 'Target': return 'bg-ocean-100 text-ocean-700';
      default: return 'bg-slate-100 text-slate-700';
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
              <h1 className="text-3xl font-heading font-semibold text-slate-900">Organizations</h1>
              <p className="text-slate-500 mt-1">Manage your client accounts</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-org-btn" className="bg-ocean-950 hover:bg-ocean-900 rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading">Add Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="org-name">Organization Name *</Label>
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
                      <Label htmlFor="org-tier">Strategic Tier</Label>
                      <Select
                        value={newOrg.strategic_tier}
                        onValueChange={(value) => setNewOrg(prev => ({ ...prev, strategic_tier: value }))}
                      >
                        <SelectTrigger data-testid="org-tier-select" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Target">Target</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Strategic">Strategic</SelectItem>
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
                      data-testid="org-notes-input"
                      value={newOrg.notes}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this organization..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    data-testid="submit-org-btn"
                    onClick={handleCreateOrg}
                    className="w-full bg-ocean-950 hover:bg-ocean-900 rounded-full"
                  >
                    Add Organization
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              data-testid="org-search-input"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-slate-200"
            />
          </div>

          {/* Organizations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No organizations found</p>
              </div>
            ) : (
              filteredOrgs.map((org, index) => (
                <motion.div
                  key={org.org_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/organizations/${org.org_id}`}>
                    <Card className="border-slate-200 shadow-soft hover:shadow-hover transition-all hover:border-ocean-300 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-ocean-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-ocean-600" />
                          </div>
                          <Badge className={getTierColor(org.strategic_tier)}>
                            {org.strategic_tier}
                          </Badge>
                        </div>
                        
                        <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                          {org.name}
                        </h3>
                        
                        <div className="space-y-2 text-sm text-slate-500">
                          {org.industry && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              <span>{org.industry}</span>
                            </div>
                          )}
                          {org.region && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{org.region}</span>
                            </div>
                          )}
                          {org.company_size && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{org.company_size}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Organizations;
