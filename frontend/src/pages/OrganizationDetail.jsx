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
  X
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
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const fetchData = async () => {
    try {
      const [orgRes, contactsRes, oppsRes] = await Promise.all([
        fetch(`${API}/organizations/${orgId}`, { credentials: 'include' }),
        fetch(`${API}/contacts?org_id=${orgId}`, { credentials: 'include' }),
        fetch(`${API}/opportunities`, { credentials: 'include' })
      ]);
      
      const orgData = await orgRes.json();
      const contactsData = await contactsRes.json();
      const oppsData = await oppsRes.json();
      
      setOrganization(orgData);
      setEditData(orgData);
      setContacts(contactsData);
      setOpportunities(oppsData.filter(o => o.org_id === orgId));
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
    if (!window.confirm('Are you sure you want to delete this organization?')) return;
    
    try {
      await fetch(`${API}/organizations/${orgId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      toast.success('Organization deleted');
      navigate('/organizations');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
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
                  <Badge className={getTierColor(organization.strategic_tier)}>
                    {organization.strategic_tier}
                  </Badge>
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
              <CardHeader>
                <CardTitle className="text-lg font-heading">Contacts ({contacts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No contacts yet</p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map(contact => (
                      <Link key={contact.contact_id} to={`/contacts/${contact.contact_id}`}>
                        <div className="p-3 rounded-xl border border-slate-200 hover:border-ocean-300 transition-colors">
                          <p className="font-medium text-slate-900">{contact.name}</p>
                          <p className="text-sm text-slate-500">{contact.title}</p>
                          {contact.buying_role && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {contact.buying_role}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Opportunities ({opportunities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {opportunities.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No opportunities yet</p>
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
