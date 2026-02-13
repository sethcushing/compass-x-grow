import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Briefcase,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  User,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrganizationDetail = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isOppDialogOpen, setIsOppDialogOpen] = useState(false);
  const [newOpp, setNewOpp] = useState({
    name: '',
    engagement_type: 'Advisory',
    estimated_value: 0,
    confidence_level: 50,
    stage_id: '',
    source: 'Inbound',
    owner_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const fetchData = async () => {
    try {
      const [orgRes, contactsRes, oppsRes, usersRes, pipelinesRes] = await Promise.all([
        fetch(`${API}/organizations/${orgId}`, { credentials: 'include' }),
        fetch(`${API}/contacts?org_id=${orgId}`, { credentials: 'include' }),
        fetch(`${API}/opportunities`, { credentials: 'include' }),
        fetch(`${API}/auth/users`, { credentials: 'include' }),
        fetch(`${API}/pipelines`, { credentials: 'include' })
      ]);
      
      const orgData = await orgRes.json();
      const contactsData = await contactsRes.json();
      const oppsData = await oppsRes.json();
      const usersData = await usersRes.json();
      const pipelines = await pipelinesRes.json();
      
      setOrganization(orgData);
      setEditData(orgData);
      setContacts(contactsData);
      setOpportunities(oppsData.filter(o => o.org_id === orgId));
      setUsers(usersData);
      
      // Get stages for opportunity creation
      if (pipelines.length > 0) {
        const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
        const stagesRes = await fetch(`${API}/pipelines/${defaultPipeline.pipeline_id}/stages`, { credentials: 'include' });
        const stagesData = await stagesRes.json();
        setStages(stagesData);
        if (stagesData.length > 0) {
          setNewOpp(prev => ({ ...prev, stage_id: stagesData[0].stage_id, pipeline_id: defaultPipeline.pipeline_id }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API}/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData)
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      const updated = await response.json();
      setOrganization(updated);
      setIsEditing(false);
      toast.success('Organization updated');
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this organization? This will also remove all associated contacts and opportunities.')) return;
    
    try {
      const response = await fetch(`${API}/organizations/${orgId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete');
      }
      
      toast.success('Organization deleted');
      navigate('/organizations');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete organization');
    }
  };

  const handleCreateOpp = async () => {
    if (!newOpp.name) {
      toast.error('Opportunity name is required');
      return;
    }
    if (!newOpp.owner_id) {
      toast.error('Please select an owner');
      return;
    }
    
    try {
      const response = await fetch(`${API}/opportunities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newOpp,
          org_id: orgId,
          pipeline_id: stages[0]?.pipeline_id || 'pipe_default'
        })
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const created = await response.json();
      setOpportunities(prev => [...prev, created]);
      setIsOppDialogOpen(false);
      setNewOpp({
        name: '',
        engagement_type: 'Advisory',
        estimated_value: 0,
        confidence_level: 50,
        stage_id: stages[0]?.stage_id || '',
        source: 'Inbound',
        owner_id: ''
      });
      toast.success('Opportunity created');
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast.error('Failed to create opportunity');
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Strategic': return 'bg-amber-100 text-amber-700';
      case 'Target': return 'bg-ocean-100 text-ocean-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getOwnerName = (ownerId) => {
    const user = users.find(u => u.user_id === ownerId);
    return user?.name || 'Unassigned';
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

  if (!organization) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <p className="text-slate-500">Organization not found</p>
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
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/organizations')}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Organization Details */}
          <Card className="border-slate-200 shadow-soft mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-ocean-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-ocean-600" />
                </div>
                <div>
                  {isEditing ? (
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-heading font-semibold"
                    />
                  ) : (
                    <h1 className="text-2xl font-heading font-semibold text-slate-900">
                      {organization.name}
                    </h1>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getTierColor(organization.strategic_tier)}>
                      {organization.strategic_tier}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      Owner: {getOwnerName(organization.owner_id)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      data-testid="save-org-btn"
                      onClick={handleSave}
                      className="bg-ocean-950 hover:bg-ocean-900 rounded-full"
                    >
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(organization);
                      }}
                      className="rounded-full"
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      data-testid="edit-org-btn"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="rounded-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      data-testid="delete-org-btn"
                      variant="outline"
                      onClick={handleDelete}
                      className="rounded-full text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Industry</Label>
                    <Select
                      value={editData.industry || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Financial Services">Financial Services</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Energy">Energy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Region</Label>
                    <Select
                      value={editData.region || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, region: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North America">North America</SelectItem>
                        <SelectItem value="Europe">Europe</SelectItem>
                        <SelectItem value="APAC">APAC</SelectItem>
                        <SelectItem value="LATAM">LATAM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Company Size</Label>
                    <Select
                      value={editData.company_size || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, company_size: value }))}
                    >
                      <SelectTrigger className="mt-1">
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
                  <div>
                    <Label>Strategic Tier</Label>
                    <Select
                      value={editData.strategic_tier || 'Active'}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, strategic_tier: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Target">Target</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Strategic">Strategic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Owner</Label>
                    <Select
                      value={editData.owner_id || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, owner_id: value }))}
                    >
                      <SelectTrigger data-testid="edit-org-owner-select" className="mt-1">
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
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Industry</p>
                      <p className="font-medium text-slate-900">{organization.industry || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Region</p>
                      <p className="font-medium text-slate-900">{organization.region || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Company Size</p>
                      <p className="font-medium text-slate-900">{organization.company_size || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Contacts</p>
                      <p className="font-medium text-slate-900">{contacts.length}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!isEditing && organization.notes && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">{organization.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts & Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contacts */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-heading">Contacts ({contacts.length})</CardTitle>
                <Link to="/contacts">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Plus className="w-4 h-4 mr-1" /> Add Contact
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No contacts yet</p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map(contact => (
                      <Link key={contact.contact_id} to={`/contacts/${contact.contact_id}`}>
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-ocean-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{contact.name}</p>
                              <p className="text-sm text-slate-500">{contact.title}</p>
                            </div>
                            {contact.buying_role && (
                              <Badge variant="secondary" className="text-xs">
                                {contact.buying_role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Owner: {getOwnerName(contact.owner_id)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-heading">Opportunities ({opportunities.length})</CardTitle>
                <Dialog open={isOppDialogOpen} onOpenChange={setIsOppDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-opp-from-org-btn" variant="outline" size="sm" className="rounded-full">
                      <Plus className="w-4 h-4 mr-1" /> Add Opportunity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-heading">Create Opportunity for {organization.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="new-opp-name">Opportunity Name *</Label>
                        <Input
                          id="new-opp-name"
                          data-testid="new-opp-name-input"
                          value={newOpp.name}
                          onChange={(e) => setNewOpp(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Data Platform Modernization"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Owner *</Label>
                        <Select
                          value={newOpp.owner_id}
                          onValueChange={(value) => setNewOpp(prev => ({ ...prev, owner_id: value }))}
                        >
                          <SelectTrigger data-testid="new-opp-owner-select" className="mt-1">
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Engagement Type</Label>
                          <Select
                            value={newOpp.engagement_type}
                            onValueChange={(value) => setNewOpp(prev => ({ ...prev, engagement_type: value }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Advisory">Advisory</SelectItem>
                              <SelectItem value="Strategy">Strategy</SelectItem>
                              <SelectItem value="AI Enablement">AI Enablement</SelectItem>
                              <SelectItem value="Data Modernization">Data Modernization</SelectItem>
                              <SelectItem value="Platform / Architecture">Platform / Architecture</SelectItem>
                              <SelectItem value="Transformation">Transformation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Source</Label>
                          <Select
                            value={newOpp.source}
                            onValueChange={(value) => setNewOpp(prev => ({ ...prev, source: value }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inbound">Inbound</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Exec Intro">Exec Intro</SelectItem>
                              <SelectItem value="Expansion">Expansion</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Estimated Value ($)</Label>
                          <Input
                            type="number"
                            value={newOpp.estimated_value}
                            onChange={(e) => setNewOpp(prev => ({ ...prev, estimated_value: parseFloat(e.target.value) || 0 }))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>Confidence (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={newOpp.confidence_level}
                            onChange={(e) => setNewOpp(prev => ({ ...prev, confidence_level: parseInt(e.target.value) || 0 }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Initial Stage</Label>
                        <Select
                          value={newOpp.stage_id}
                          onValueChange={(value) => setNewOpp(prev => ({ ...prev, stage_id: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.filter(s => !s.name.includes('Closed')).map(stage => (
                              <SelectItem key={stage.stage_id} value={stage.stage_id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button
                        data-testid="submit-new-opp-btn"
                        onClick={handleCreateOpp}
                        className="w-full bg-ocean-950 hover:bg-ocean-900 rounded-full"
                      >
                        Create Opportunity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {opportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No opportunities yet</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Opportunity" to create one</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {opportunities.map(opp => (
                      <Link key={opp.opp_id} to={`/opportunities/${opp.opp_id}`}>
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-ocean-300 transition-colors">
                          <p className="font-medium text-slate-900">{opp.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-slate-500">{opp.engagement_type}</span>
                            <span className="font-medium text-ocean-600">
                              {formatCurrency(opp.estimated_value)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Owner: {getOwnerName(opp.owner_id)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default OrganizationDetail;
