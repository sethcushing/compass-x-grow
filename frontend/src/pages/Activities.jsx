import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Users,
  Presentation,
  MessageSquare,
  Building2,
  Mail,
  Video,
  FileText,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'by-client'
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: 'Call',
    org_id: '',
    due_date: '',
    notes: '',
    status: 'Planned'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesRes, oppsRes, orgsRes] = await Promise.all([
        fetch(`${API}/activities`, { credentials: 'include' }),
        fetch(`${API}/opportunities`, { credentials: 'include' }),
        fetch(`${API}/organizations`, { credentials: 'include' })
      ]);
      
      const activitiesData = await activitiesRes.json();
      const oppsData = await oppsRes.json();
      const orgsData = await orgsRes.json();
      
      setActivities(activitiesData);
      setOpportunities(oppsData);
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (activityId) => {
    try {
      await fetch(`${API}/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Completed' })
      });
      
      setActivities(prev => prev.map(a => 
        a.activity_id === activityId ? { ...a, status: 'Completed' } : a
      ));
      toast.success('Activity completed');
    } catch (error) {
      console.error('Error completing activity:', error);
      toast.error('Failed to complete activity');
    }
  };

  const handleDelete = async (activityId) => {
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

  const handleCreateActivity = async () => {
    if (!newActivity.due_date) {
      toast.error('Due date is required');
      return;
    }
    if (!newActivity.org_id) {
      toast.error('Please select a client');
      return;
    }
    
    try {
      const response = await fetch(`${API}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newActivity)
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const created = await response.json();
      setActivities(prev => [...prev, created]);
      setIsDialogOpen(false);
      setNewActivity({
        activity_type: 'Call',
        org_id: '',
        due_date: '',
        notes: '',
        status: 'Planned'
      });
      toast.success('Activity created');
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    }
  };

  const getActivityStatus = (activity) => {
    if (activity.status === 'Completed') return 'completed';
    const dueDate = new Date(activity.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return 'overdue';
    if (dueDate.toDateString() === today.toDateString()) return 'today';
    return 'upcoming';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'Call': return Phone;
      case 'Meeting': return Video;
      case 'Email': return Mail;
      case 'Demo': case 'Workshop': return Presentation;
      default: return FileText;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'overdue': return 'bg-rose-100 text-rose-700';
      case 'today': return 'bg-amber-100 text-amber-700';
      default: return 'bg-ocean-100 text-ocean-700';
    }
  };

  const getOpportunityName = (oppId) => {
    const opp = opportunities.find(o => o.opp_id === oppId);
    return opp?.name || 'No opportunity';
  };

  const getOrganizationName = (orgId) => {
    if (!orgId) return null;
    const org = organizations.find(o => o.org_id === orgId);
    return org?.name || null;
  };

  const getClientForActivity = (activity) => {
    // Direct org link
    if (activity.org_id) {
      const org = organizations.find(o => o.org_id === activity.org_id);
      return org;
    }
    // Via opportunity
    if (activity.opp_id) {
      const opp = opportunities.find(o => o.opp_id === activity.opp_id);
      if (opp) {
        const org = organizations.find(o => o.org_id === opp.org_id);
        return org;
      }
    }
    return null;
  };

  // Group activities by client for by-client view
  const getActivitiesByClient = () => {
    const grouped = {};
    
    activities.forEach(activity => {
      const client = getClientForActivity(activity);
      const clientId = client?.org_id || 'unassigned';
      const clientName = client?.name || 'Unassigned';
      
      if (!grouped[clientId]) {
        grouped[clientId] = {
          client,
          clientName,
          activities: []
        };
      }
      grouped[clientId].activities.push(activity);
    });
    
    // Sort by client name
    return Object.values(grouped).sort((a, b) => 
      a.clientName.localeCompare(b.clientName)
    );
  };

  const filterActivities = (acts, status) => {
    const filtered = acts.filter(a => {
      const actStatus = getActivityStatus(a);
      if (status === 'upcoming') return actStatus === 'upcoming' || actStatus === 'today';
      if (status === 'overdue') return actStatus === 'overdue';
      if (status === 'completed') return actStatus === 'completed';
      return true;
    });
    
    // Apply search filter
    if (searchQuery) {
      return filtered.filter(a => 
        a.activity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getOpportunityName(a.opp_id)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getOrganizationName(a.org_id)?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  };

  const filteredActivities = filterActivities(activities, activeTab);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const upcomingCount = activities.filter(a => ['upcoming', 'today'].includes(getActivityStatus(a))).length;
  const overdueCount = activities.filter(a => getActivityStatus(a) === 'overdue').length;
  const completedCount = activities.filter(a => getActivityStatus(a) === 'completed').length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-heading font-semibold text-slate-900">Activities</h1>
              <p className="text-slate-500 mt-1">Track client engagement and follow-ups</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'timeline' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('by-client')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'by-client' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  By Client
                </button>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="create-activity-btn" className="bg-ocean-950 hover:bg-ocean-900 rounded-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Activity
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Add Activity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Client *</Label>
                      <Select
                        value={newActivity.org_id}
                        onValueChange={(value) => setNewActivity(prev => ({ ...prev, org_id: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select client" />
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
                      className="w-full bg-ocean-950 hover:bg-ocean-900 rounded-full"
                    >
                      Add Activity
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-slate-200"
            />
          </div>

          {viewMode === 'by-client' ? (
            /* By Client View */
            <div className="space-y-6">
              {getActivitiesByClient().map(({ client, clientName, activities: clientActivities }) => (
                <Card key={client?.org_id || 'unassigned'} className="border-slate-200 shadow-soft">
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-ocean-600" />
                      </div>
                      <div>
                        {client ? (
                          <Link to={`/organizations/${client.org_id}`} className="font-heading font-semibold text-slate-900 hover:text-ocean-600">
                            {clientName}
                          </Link>
                        ) : (
                          <span className="font-heading font-semibold text-slate-500">{clientName}</span>
                        )}
                        <p className="text-sm text-slate-500">{clientActivities.length} activities</p>
                      </div>
                    </div>
                    {client?.is_at_risk && (
                      <Badge className="bg-rose-100 text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        At Risk
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {clientActivities.slice(0, 5).map(activity => {
                        const Icon = getActivityIcon(activity.activity_type);
                        const status = getActivityStatus(activity);
                        return (
                          <div key={activity.activity_id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              status === 'completed' ? 'bg-emerald-100' : 
                              status === 'overdue' ? 'bg-rose-100' : 'bg-ocean-100'
                            }`}>
                              <Icon className={`w-4 h-4 ${
                                status === 'completed' ? 'text-emerald-600' : 
                                status === 'overdue' ? 'text-rose-600' : 'text-ocean-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{activity.activity_type}</p>
                              <p className="text-xs text-slate-500">{activity.notes || 'No notes'}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(status)}>
                                {status === 'completed' ? 'Completed' : 
                                 status === 'overdue' ? 'Overdue' : 
                                 status === 'today' ? 'Today' : 'Upcoming'}
                              </Badge>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(activity.due_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            {status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleComplete(activity.activity_id)}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(activity.activity_id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              data-testid={`delete-activity-${activity.activity_id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                      {clientActivities.length > 5 && (
                        <p className="text-sm text-slate-500 text-center py-2">
                          +{clientActivities.length - 5} more activities
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Timeline View */
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <Card className="border-slate-200 shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-ocean-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-ocean-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-semibold text-slate-900">{upcomingCount}</p>
                        <p className="text-sm text-slate-500">Upcoming</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-slate-200 shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-semibold text-slate-900">{overdueCount}</p>
                        <p className="text-sm text-slate-500">Overdue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-slate-200 shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-semibold text-slate-900">{completedCount}</p>
                        <p className="text-sm text-slate-500">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="upcoming" className="data-[state=active]:bg-ocean-50">
                    Upcoming ({upcomingCount})
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="data-[state=active]:bg-rose-50">
                    Overdue ({overdueCount})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-50">
                    Completed ({completedCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {filteredActivities.length === 0 ? (
                    <Card className="border-slate-200 shadow-soft">
                      <CardContent className="py-16 text-center">
                        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-heading font-medium text-slate-900">No activities</h3>
                        <p className="text-slate-500 mt-1">
                          {activeTab === 'upcoming' && "You're all caught up!"}
                          {activeTab === 'overdue' && "No overdue activities"}
                          {activeTab === 'completed' && "No completed activities yet"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredActivities.map(activity => {
                        const Icon = getActivityIcon(activity.activity_type);
                        const status = getActivityStatus(activity);
                        const client = getClientForActivity(activity);
                        
                        return (
                          <Card key={activity.activity_id} className="border-slate-200 shadow-soft hover:shadow-md transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  status === 'completed' ? 'bg-emerald-100' : 
                                  status === 'overdue' ? 'bg-rose-100' : 'bg-ocean-100'
                                }`}>
                                  <Icon className={`w-6 h-6 ${
                                    status === 'completed' ? 'text-emerald-600' : 
                                    status === 'overdue' ? 'text-rose-600' : 'text-ocean-600'
                                  }`} />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-heading font-medium text-slate-900">
                                      {activity.activity_type}
                                    </h3>
                                    <Badge className={getStatusColor(status)}>
                                      {status === 'completed' ? 'Completed' : 
                                       status === 'overdue' ? 'Overdue' : 
                                       status === 'today' ? 'Today' : 'Upcoming'}
                                    </Badge>
                                  </div>
                                  {client && (
                                    <Link to={`/organizations/${client.org_id}`} className="text-sm text-ocean-600 hover:underline flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {client.name}
                                    </Link>
                                  )}
                                  {activity.opp_id && (
                                    <Link to={`/opportunities/${activity.opp_id}`} className="text-sm text-slate-500 hover:text-ocean-600">
                                      {getOpportunityName(activity.opp_id)}
                                    </Link>
                                  )}
                                  {activity.notes && (
                                    <p className="text-sm text-slate-500 mt-1">{activity.notes}</p>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <p className="text-sm font-medium text-slate-900">
                                    {new Date(activity.due_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(activity.due_date).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                
                                {status !== 'completed' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleComplete(activity.activity_id)}
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(activity.activity_id)}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  data-testid={`delete-activity-${activity.activity_id}`}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Activities;
