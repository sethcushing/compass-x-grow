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
  User, 
  Mail, 
  Phone,
  Building2,
  Briefcase,
  Edit2,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ContactDetail = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, [contactId]);

  const fetchData = async () => {
    try {
      const [contactRes, usersRes] = await Promise.all([
        fetch(`${API}/contacts/${contactId}`, { credentials: 'include' }),
        fetch(`${API}/auth/users`, { credentials: 'include' })
      ]);
      const contactData = await contactRes.json();
      const usersData = await usersRes.json();
      setContact(contactData);
      setEditData(contactData);
      setUsers(usersData);
      
      if (contactData.org_id) {
        const orgRes = await fetch(`${API}/organizations/${contactData.org_id}`, { credentials: 'include' });
        const orgData = await orgRes.json();
        setOrganization(orgData);
      }
      
      const oppsRes = await fetch(`${API}/opportunities`, { credentials: 'include' });
      const oppsData = await oppsRes.json();
      setOpportunities(oppsData.filter(o => o.primary_contact_id === contactId));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load contact');
    } finally {
      setLoading(false);
    }
  };

  const getOwnerName = (ownerId) => {
    const user = users.find(u => u.user_id === ownerId);
    return user?.name || 'Unassigned';
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API}/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData)
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      const updated = await response.json();
      setContact(updated);
      setIsEditing(false);
      toast.success('Contact updated');
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await fetch(`${API}/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      toast.success('Contact deleted');
      navigate('/contacts');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const getBuyingRoleColor = (role) => {
    switch (role) {
      case 'Decision Maker': return 'bg-emerald-100 text-emerald-700';
      case 'Champion': return 'bg-amber-100 text-amber-700';
      case 'Influencer': return 'bg-ocean-100 text-ocean-700';
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

  if (!contact) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <p className="text-slate-500">Contact not found</p>
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
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/contacts')}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Contact Details */}
          <Card className="border-slate-200 shadow-soft mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-ocean-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-ocean-700">
                    {contact.name.charAt(0)}
                  </span>
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
                      {contact.name}
                    </h1>
                  )}
                  <p className="text-slate-500">{contact.title}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      data-testid="save-contact-btn"
                      onClick={handleSave}
                      className="bg-ocean-950 hover:bg-ocean-900 rounded-full"
                    >
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(contact);
                      }}
                      className="rounded-full"
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      data-testid="edit-contact-btn"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="rounded-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      data-testid="delete-contact-btn"
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
                    <Label>Title</Label>
                    <Input
                      value={editData.title || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={editData.phone || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Function</Label>
                    <Select
                      value={editData.function || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, function: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select function" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Data">Data</SelectItem>
                        <SelectItem value="AI">AI</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Ops">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Buying Role</Label>
                    <Select
                      value={editData.buying_role || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, buying_role: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Decision Maker">Decision Maker</SelectItem>
                        <SelectItem value="Influencer">Influencer</SelectItem>
                        <SelectItem value="Champion">Champion</SelectItem>
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
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {contact.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <a href={`mailto:${contact.email}`} className="font-medium text-ocean-600 hover:underline">
                            {contact.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Phone</p>
                          <p className="font-medium text-slate-900">{contact.phone}</p>
                        </div>
                      </div>
                    )}
                    {contact.function && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Function</p>
                          <p className="font-medium text-slate-900">{contact.function}</p>
                        </div>
                      </div>
                    )}
                    {contact.buying_role && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Buying Role</p>
                        <Badge className={getBuyingRoleColor(contact.buying_role)}>
                          {contact.buying_role}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {organization && (
                    <Link to={`/organizations/${organization.org_id}`}>
                      <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4 hover:bg-slate-100 transition-colors">
                        <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-ocean-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Organization</p>
                          <p className="font-medium text-slate-900">{organization.name}</p>
                        </div>
                      </div>
                    </Link>
                  )}
                  
                  {contact.notes && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 mb-2">Notes</p>
                      <p className="text-sm text-slate-600">{contact.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Opportunities */}
          <Card className="border-slate-200 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Related Opportunities ({opportunities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No related opportunities</p>
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
        </motion.div>
      </main>
    </div>
  );
};

export default ContactDetail;
