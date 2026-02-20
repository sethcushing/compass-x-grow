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
  Target,
  Calendar,
  Phone,
  Mail,
  Video,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Presentation,
  ExternalLink,
  Send,
  DollarSign,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Glassmorphic Card Component
const GlassCard = ({ children, className = '', glow = false }) => {
  const { theme } = useTheme();
  return (
    <div className={`
      relative overflow-hidden rounded-2xl
      ${theme === 'dark' 
        ? 'bg-white/5 border border-white/10 backdrop-blur-xl' 
        : 'bg-white border border-slate-200 shadow-lg shadow-slate-200/50'
      }
      ${glow && theme === 'dark' ? 'ring-1 ring-ocean-500/20' : ''}
      ${className}
    `}>
      {theme === 'dark' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
};

const OrganizationDetail = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [organization, setOrganization] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  
  // Dialog states
  const [isOppDialogOpen, setIsOppDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  
  const [newOpp, setNewOpp] = useState({
    name: '',
    engagement_type: 'Advisory',
    confidence_level: 50,
    stage_id: '',
    owner_id: ''
  });
  
  const [newContact, setNewContact] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    buying_role: '',
    owner_id: ''
  });
  
  const [newActivity, setNewActivity] = useState({
    activity_type: 'Call',
    title: '',
    due_date: '',
    notes: '',
    status: 'Planned'
  });
  
  const [newNote, setNewNote] = useState('');
  const [orgSummary, setOrgSummary] = useState({ buyer: null, opportunities: { count: 0, total_value: 0, avg_confidence: 0 } });

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const fetchData = async () => {
    try {
      const [orgRes, contactsRes, oppsRes, usersRes, pipelinesRes, activitiesRes, summaryRes] = await Promise.all([
        fetch(`${API}/organizations/${orgId}`, { credentials: 'include' }),
        fetch(`${API}/contacts?org_id=${orgId}`, { credentials: 'include' }),
        fetch(`${API}/opportunities`, { credentials: 'include' }),
        fetch(`${API}/auth/users`, { credentials: 'include' }),
        fetch(`${API}/pipelines`, { credentials: 'include' }),
        fetch(`${API}/activities?org_id=${orgId}`, { credentials: 'include' }),
        fetch(`${API}/organizations/${orgId}/summary`, { credentials: 'include' })
      ]);
      
      const orgData = await orgRes.json();
      const contactsData = await contactsRes.json();
      const oppsData = await oppsRes.json();
      const usersData = await usersRes.json();
      const pipelines = await pipelinesRes.json();
      const activitiesData = await activitiesRes.json();
      const summaryData = summaryRes.ok ? await summaryRes.json() : { buyer: null, opportunities: { count: 0, total_value: 0, avg_confidence: 0 } };
      
      setOrganization(orgData);
      setEditData(orgData);
      setContacts(contactsData);
      setOpportunities(oppsData.filter(o => o.org_id === orgId));
      setUsers(usersData);
      setActivities(activitiesData);
      setOrgSummary(summaryData);
      
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
      toast.error('Failed to load client');
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
      toast.success('Client updated');
      
      // Refresh org summary to update header
      const summaryRes = await fetch(`${API}/organizations/${orgId}/summary`, { credentials: 'include' });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setOrgSummary(summaryData);
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this client? This will also remove all associated contacts and opportunities.')) return;
    
    try {
      const response = await fetch(`${API}/organizations/${orgId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete');
      }
      
      toast.success('Client deleted');
      navigate('/organizations');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete client');
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
        confidence_level: 50,
        stage_id: stages[0]?.stage_id || '',
        owner_id: ''
      });
      toast.success('Opportunity created');
      
      // Refresh org summary to update pipeline/active sections
      const summaryRes = await fetch(`${API}/organizations/${orgId}/summary`, { credentials: 'include' });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setOrgSummary(summaryData);
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast.error('Failed to create opportunity');
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.name) {
      toast.error('Contact name is required');
      return;
    }
    if (!newContact.owner_id) {
      toast.error('Please select an owner');
      return;
    }
    
    try {
      const response = await fetch(`${API}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newContact,
          org_id: orgId
        })
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const created = await response.json();
      setContacts(prev => [...prev, created]);
      setIsContactDialogOpen(false);
      setNewContact({
        name: '',
        title: '',
        email: '',
        phone: '',
        buying_role: '',
        owner_id: ''
      });
      toast.success('Contact created');
      
      // Refresh org summary to update buyer info
      const summaryRes = await fetch(`${API}/organizations/${orgId}/summary`, { credentials: 'include' });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setOrgSummary(summaryData);
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact');
    }
  };

  const handleCreateActivity = async () => {
    if (!newActivity.due_date) {
      toast.error('Due date is required');
      return;
    }
    
    try {
      const response = await fetch(`${API}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newActivity,
          org_id: orgId
        })
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const created = await response.json();
      setActivities(prev => [...prev, created]);
      setIsActivityDialogOpen(false);
      setNewActivity({
        activity_type: 'Call',
        due_date: '',
        notes: '',
        status: 'Planned'
      });
      toast.success('Activity created');
      // Refresh to update at-risk status
      fetchData();
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    
    try {
      const response = await fetch(`${API}/activities/${activityId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      setActivities(prev => prev.filter(a => a.activity_id !== activityId));
      toast.success('Activity deleted');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    
    try {
      const response = await fetch(`${API}/organizations/${orgId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: newNote.trim() })
      });
      
      if (!response.ok) throw new Error('Failed to add note');
      
      const noteEntry = await response.json();
      
      // Update local state
      setOrganization(prev => ({
        ...prev,
        notes_history: [...(prev.notes_history || []), noteEntry]
      }));
      setNewNote('');
      toast.success('Note added');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Current': return 'bg-emerald-100 text-emerald-700';
      case 'Future': return 'bg-ocean-100 text-ocean-700';
      case 'Return': return 'bg-amber-100 text-amber-700';
      case 'Strategic': return 'bg-emerald-100 text-emerald-700';
      case 'Target': return 'bg-ocean-100 text-ocean-700';
      case 'Active': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Strategic': return 'Current';
      case 'Target': return 'Future';
      case 'Active': return 'Return';
      default: return status;
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'Call': return Phone;
      case 'Email': return Mail;
      case 'Meeting': return Video;
      case 'Demo': 
      case 'Workshop': 
      case 'Discovery Session': return Presentation;
      default: return FileText;
    }
  };

  const getActivityStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-emerald-600';
      case 'Planned': return 'text-ocean-600';
      default: return 'text-slate-600';
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

  if (!organization) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <p className="text-slate-500">Client not found</p>
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
              Back to Clients
            </Button>
          </div>

          {/* Client Details */}
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
                    <Badge className={getStatusColor(organization.strategic_tier)}>
                      {getStatusLabel(organization.strategic_tier)}
                    </Badge>
                    {organization.is_at_risk && (
                      <Badge className="bg-rose-100 text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        At Risk
                      </Badge>
                    )}
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
                      className="bg-ocean-600 hover:bg-ocean-700 rounded-full"
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
            
            {/* Summary Stats - Buyer, Deals, Value, Confidence, Won/Lost */}
            {!isEditing && (
              <div className="px-6 pb-4">
                <div className="grid grid-cols-6 gap-4">
                  {/* Buyer */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-400 uppercase mb-2">Buyer</p>
                    {orgSummary.buyer ? (
                      <div>
                        <p className="font-semibold text-slate-900">{orgSummary.buyer.name}</p>
                        <p className="text-sm text-slate-500">{orgSummary.buyer.buying_role}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Not identified</p>
                    )}
                  </div>
                  
                  {/* Deals */}
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <p className="text-xs font-medium text-emerald-600 uppercase mb-2">Deals</p>
                    <p className="text-2xl font-bold text-emerald-700">{orgSummary.opportunities.count}</p>
                  </div>
                  
                  {/* Total Value */}
                  <div className="p-4 bg-ocean-50 rounded-xl" data-testid="client-total-value">
                    <p className="text-xs font-medium text-ocean-600 uppercase mb-2">Total Value</p>
                    <p className="text-2xl font-bold text-ocean-700">
                      ${orgSummary.opportunities.total_value >= 1000000 
                        ? `${(orgSummary.opportunities.total_value / 1000000).toFixed(2)}M`
                        : orgSummary.opportunities.total_value >= 1000 
                          ? `${(orgSummary.opportunities.total_value / 1000).toFixed(0)}K` 
                          : orgSummary.opportunities.total_value.toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Pipeline Value */}
                  <div className="p-4 bg-blue-50 rounded-xl" data-testid="client-pipeline-value">
                    <p className="text-xs font-medium text-blue-600 uppercase mb-2">Pipeline</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ${(orgSummary.opportunities.pipeline_value || 0) >= 1000000 
                        ? `${((orgSummary.opportunities.pipeline_value || 0) / 1000000).toFixed(2)}M`
                        : (orgSummary.opportunities.pipeline_value || 0) >= 1000 
                          ? `${((orgSummary.opportunities.pipeline_value || 0) / 1000).toFixed(0)}K` 
                          : (orgSummary.opportunities.pipeline_value || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-500">{orgSummary.opportunities.pipeline_count || 0} deals</p>
                  </div>
                  
                  {/* Won Value */}
                  <div className="p-4 bg-green-50 rounded-xl" data-testid="client-won-value">
                    <p className="text-xs font-medium text-green-600 uppercase mb-2">Won</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${(orgSummary.opportunities.won_value || 0) >= 1000000 
                        ? `${((orgSummary.opportunities.won_value || 0) / 1000000).toFixed(2)}M`
                        : (orgSummary.opportunities.won_value || 0) >= 1000 
                          ? `${((orgSummary.opportunities.won_value || 0) / 1000).toFixed(0)}K` 
                          : (orgSummary.opportunities.won_value || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-500">{orgSummary.opportunities.won_count || 0} deals</p>
                  </div>
                  
                  {/* Lost Value */}
                  <div className="p-4 bg-rose-50 rounded-xl" data-testid="client-lost-value">
                    <p className="text-xs font-medium text-rose-600 uppercase mb-2">Lost</p>
                    <p className="text-2xl font-bold text-rose-700">
                      ${(orgSummary.opportunities.lost_value || 0) >= 1000000 
                        ? `${((orgSummary.opportunities.lost_value || 0) / 1000000).toFixed(2)}M`
                        : (orgSummary.opportunities.lost_value || 0) >= 1000 
                          ? `${((orgSummary.opportunities.lost_value || 0) / 1000).toFixed(0)}K` 
                          : (orgSummary.opportunities.lost_value || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-rose-500">{orgSummary.opportunities.lost_count || 0} deals</p>
                  </div>
                </div>
              </div>
            )}
            
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
                    <Label>Client Status</Label>
                    <Select
                      value={editData.strategic_tier || 'Current'}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, strategic_tier: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Current">Current</SelectItem>
                        <SelectItem value="Future">Future</SelectItem>
                        <SelectItem value="Return">Return</SelectItem>
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
                  <div className="col-span-2">
                    <Label>Google Drive Link</Label>
                    <Input
                      value={editData.google_drive_link || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, google_drive_link: e.target.value }))}
                      placeholder="https://drive.google.com/..."
                      className="mt-1"
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
              
              {/* Google Drive Link - Prominent */}
              {!isEditing && organization.google_drive_link && (
                <div className="mt-6">
                  <a 
                    href={organization.google_drive_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-ocean-50 rounded-xl hover:bg-ocean-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-ocean-600" />
                    </div>
                    <div>
                      <p className="font-medium text-ocean-700">Google Drive</p>
                      <p className="text-sm text-ocean-600">Open client folder</p>
                    </div>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Notes Running Tally Section */}
          <Card className="border-slate-200 shadow-soft mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add New Note */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  className="flex-1"
                  data-testid="new-note-input"
                />
                <Button 
                  onClick={handleAddNote}
                  className="bg-ocean-600 hover:bg-ocean-700"
                  data-testid="add-note-btn"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Notes History */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {organization.notes_history?.length > 0 ? (
                  [...organization.notes_history].reverse().map((note, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700">{note.text}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <span>{note.created_by_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(note.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  ))
                ) : organization.notes ? (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">{organization.notes}</p>
                    <p className="text-xs text-slate-400 mt-2">Legacy note</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">No notes yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activities Section */}
          <Card className="border-slate-200 shadow-soft mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-heading">Activities ({activities.length})</CardTitle>
              <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="add-activity-btn" variant="outline" size="sm" className="rounded-full">
                    <Plus className="w-4 h-4 mr-1" /> Add Activity
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Add Activity for {organization.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={newActivity.title}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Discuss Q2 roadmap"
                        className="mt-1"
                        data-testid="activity-title-input"
                      />
                    </div>
                    
                    <div>
                      <Label>Activity Type</Label>
                      <Select
                        value={newActivity.activity_type}
                        onValueChange={(value) => setNewActivity(prev => ({ ...prev, activity_type: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Call">Call</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Meeting">Meeting</SelectItem>
                          <SelectItem value="Demo">Demo</SelectItem>
                          <SelectItem value="Workshop">Workshop</SelectItem>
                          <SelectItem value="Discovery Session">Discovery Session</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                          <SelectItem value="Exec Readout">Exec Readout</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Due Date *</Label>
                      <Input
                        type="datetime-local"
                        value={newActivity.due_date}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, due_date: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={newActivity.notes}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Activity details..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <Button
                      data-testid="submit-activity-btn"
                      onClick={handleCreateActivity}
                      className="w-full bg-ocean-600 hover:bg-ocean-700 rounded-full"
                    >
                      Add Activity
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No activities yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add an activity to track client engagement</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map(activity => {
                    const Icon = getActivityIcon(activity.activity_type);
                    return (
                      <div key={activity.activity_id} className="p-3 rounded-xl border border-slate-200 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.status === 'Completed' ? 'bg-emerald-100' : 'bg-ocean-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${getActivityStatusColor(activity.status)}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{activity.title || activity.activity_type}</p>
                          <p className="text-sm text-slate-500">{activity.notes || 'No notes'}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className={activity.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                            {activity.status}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(activity.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteActivity(activity.activity_id)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          data-testid={`delete-activity-${activity.activity_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
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
                <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-contact-btn" variant="outline" size="sm" className="rounded-full">
                      <Plus className="w-4 h-4 mr-1" /> Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-heading">Add Contact for {organization.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={newContact.name}
                          onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., John Smith"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newContact.title}
                          onChange={(e) => setNewContact(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., VP of Engineering"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newContact.email}
                            onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john@company.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={newContact.phone}
                            onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+1 555-1234"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Buying Role</Label>
                        <Select
                          value={newContact.buying_role}
                          onValueChange={(value) => setNewContact(prev => ({ ...prev, buying_role: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Decision Maker">Decision Maker</SelectItem>
                            <SelectItem value="Influencer">Influencer</SelectItem>
                            <SelectItem value="Champion">Champion</SelectItem>
                            <SelectItem value="User">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Owner *</Label>
                        <Select
                          value={newContact.owner_id}
                          onValueChange={(value) => setNewContact(prev => ({ ...prev, owner_id: value }))}
                        >
                          <SelectTrigger className="mt-1">
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
                      
                      <Button
                        data-testid="submit-contact-btn"
                        onClick={handleCreateContact}
                        className="w-full bg-ocean-600 hover:bg-ocean-700 rounded-full"
                      >
                        Add Contact
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No contacts yet</p>
                  </div>
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
                      
                      <Button
                        data-testid="submit-new-opp-btn"
                        onClick={handleCreateOpp}
                        className="w-full bg-ocean-600 hover:bg-ocean-700 rounded-full"
                      >
                        Create Opportunity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* Pipeline Opportunities */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Pipeline Opportunities ({orgSummary.pipeline_opportunities?.length || 0})
                  </h4>
                  {(orgSummary.pipeline_opportunities?.length || 0) === 0 ? (
                    <div className="text-center py-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-400">No pipeline opportunities</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orgSummary.pipeline_opportunities?.map(opp => {
                        const stage = stages.find(s => s.stage_id === opp.stage_id);
                        return (
                          <Link key={opp.opp_id} to={`/opportunities/${opp.opp_id}`}>
                            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/30 hover:border-blue-300 transition-colors">
                              <p className="font-medium text-slate-900">{opp.name}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-slate-500">{stage?.name || opp.engagement_type}</span>
                                <span className="font-medium text-ocean-600">
                                  {formatCurrency(opp.estimated_value)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-2">
                                Owner: {getOwnerName(opp.owner_id)}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Active Opportunities (Closed Won) */}
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Active Opportunities - Closed Won ({orgSummary.active_opportunities?.length || 0})
                  </h4>
                  {(orgSummary.active_opportunities?.length || 0) === 0 ? (
                    <div className="text-center py-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-400">No active (closed won) opportunities</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orgSummary.active_opportunities?.map(opp => (
                        <Link key={opp.opp_id} to={`/opportunities/${opp.opp_id}`}>
                          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 transition-colors">
                            <p className="font-medium text-slate-900">{opp.name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">Closed Won</Badge>
                              <span className="font-medium text-emerald-600">
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
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default OrganizationDetail;
