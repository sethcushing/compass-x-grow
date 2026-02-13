import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
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
  User,
  Mail,
  Phone,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    title: '',
    function: '',
    email: '',
    phone: '',
    buying_role: '',
    org_id: '',
    owner_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contactsRes, orgsRes, usersRes] = await Promise.all([
        fetch(`${API}/contacts`, { credentials: 'include' }),
        fetch(`${API}/organizations`, { credentials: 'include' }),
        fetch(`${API}/auth/users`, { credentials: 'include' })
      ]);
      
      const contactsData = await contactsRes.json();
      const orgsData = await orgsRes.json();
      
      setContacts(contactsData);
      setOrganizations(orgsData);
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.org_id) {
      toast.error('Name and Organization are required');
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
        body: JSON.stringify(newContact)
      });

      if (!response.ok) throw new Error('Failed to create');

      const created = await response.json();
      setContacts(prev => [...prev, created]);
      setIsDialogOpen(false);
      setNewContact({
        name: '',
        title: '',
        function: '',
        email: '',
        phone: '',
        buying_role: '',
        org_id: '',
        owner_id: '',
        notes: ''
      });
      toast.success('Contact created');
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact');
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.user_id === userId);
    return user?.name || 'Unassigned';
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBuyingRoleColor = (role) => {
    switch (role) {
      case 'Decision Maker': return 'bg-emerald-100 text-emerald-700';
      case 'Champion': return 'bg-amber-100 text-amber-700';
      case 'Influencer': return 'bg-ocean-100 text-ocean-700';
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
            <div className="grid grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>
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
              <h1 className="text-3xl font-heading font-semibold text-slate-900">Contacts</h1>
              <p className="text-slate-500 mt-1">Manage your client contacts</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-contact-btn" className="bg-ocean-950 hover:bg-ocean-900 rounded-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading">Add Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name">Name *</Label>
                      <Input
                        id="contact-name"
                        data-testid="contact-name-input"
                        value={newContact.name}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-title">Title</Label>
                      <Input
                        id="contact-title"
                        data-testid="contact-title-input"
                        value={newContact.title}
                        onChange={(e) => setNewContact(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Chief Data Officer"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-org">Organization *</Label>
                    <Select
                      value={newContact.org_id}
                      onValueChange={(value) => setNewContact(prev => ({ ...prev, org_id: value }))}
                    >
                      <SelectTrigger data-testid="contact-org-select" className="mt-1">
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map(org => (
                          <SelectItem key={org.org_id} value={org.org_id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        data-testid="contact-email-input"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@company.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Input
                        id="contact-phone"
                        data-testid="contact-phone-input"
                        value={newContact.phone}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 555-0123"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-function">Function</Label>
                      <Select
                        value={newContact.function}
                        onValueChange={(value) => setNewContact(prev => ({ ...prev, function: value }))}
                      >
                        <SelectTrigger data-testid="contact-function-select" className="mt-1">
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
                      <Label htmlFor="contact-role">Buying Role</Label>
                      <Select
                        value={newContact.buying_role}
                        onValueChange={(value) => setNewContact(prev => ({ ...prev, buying_role: value }))}
                      >
                        <SelectTrigger data-testid="contact-role-select" className="mt-1">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Decision Maker">Decision Maker</SelectItem>
                          <SelectItem value="Influencer">Influencer</SelectItem>
                          <SelectItem value="Champion">Champion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-owner">Owner *</Label>
                    <Select
                      value={newContact.owner_id}
                      onValueChange={(value) => setNewContact(prev => ({ ...prev, owner_id: value }))}
                    >
                      <SelectTrigger data-testid="contact-owner-select" className="mt-1">
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
                    <Label htmlFor="contact-notes">Notes</Label>
                    <Textarea
                      id="contact-notes"
                      data-testid="contact-notes-input"
                      value={newContact.notes}
                      onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    data-testid="submit-contact-btn"
                    onClick={handleCreateContact}
                    className="w-full bg-ocean-950 hover:bg-ocean-900 rounded-full"
                  >
                    Add Contact
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              data-testid="contact-search-input"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-slate-200"
            />
          </div>

          {/* Contacts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No contacts found</p>
              </div>
            ) : (
              filteredContacts.map((contact, index) => {
                const org = organizations.find(o => o.org_id === contact.org_id);
                return (
                  <motion.div
                    key={contact.contact_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/contacts/${contact.contact_id}`}>
                      <Card className="border-slate-200 shadow-soft hover:shadow-hover transition-all hover:border-ocean-300 cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-ocean-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-medium text-ocean-700">
                                {contact.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-semibold text-slate-900 truncate">
                                {contact.name}
                              </h3>
                              <p className="text-sm text-slate-500 truncate">{contact.title || 'No title'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{org?.name || 'Unknown'}</span>
                            </div>
                            {contact.email && (
                              <div className="flex items-center gap-2 text-slate-500">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{contact.email}</span>
                              </div>
                            )}
                          </div>
                          
                          {contact.buying_role && (
                            <Badge className={`mt-4 ${getBuyingRoleColor(contact.buying_role)}`}>
                              {contact.buying_role}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Contacts;
