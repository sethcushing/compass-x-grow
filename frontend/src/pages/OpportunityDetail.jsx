import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  User,
  DollarSign,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
  FileText,
  Mail,
  Lightbulb,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OpportunityDetail = () => {
  const { oppId } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [contact, setContact] = useState(null);
  const [activities, setActivities] = useState([]);
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: 'Call',
    due_date: '',
    notes: ''
  });
  
  // AI Copilot state
  const [aiLoading, setAiLoading] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);

  useEffect(() => {
    fetchData();
  }, [oppId]);

  const fetchData = async () => {
    try {
      const [oppRes, activitiesRes, pipelinesRes, usersRes] = await Promise.all([
        fetch(`${API}/opportunities/${oppId}`, { credentials: 'include' }),
        fetch(`${API}/activities?opp_id=${oppId}`, { credentials: 'include' }),
        fetch(`${API}/pipelines`, { credentials: 'include' }),
        fetch(`${API}/auth/users`, { credentials: 'include' })
      ]);
      
      const oppData = await oppRes.json();
      const activitiesData = await activitiesRes.json();
      const pipelines = await pipelinesRes.json();
      const usersData = await usersRes.json();
      
      setOpportunity(oppData);
      setEditData(oppData);
      setActivities(activitiesData);
      setUsers(usersData);
      
      if (pipelines.length > 0) {
        const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
        const stagesRes = await fetch(`${API}/pipelines/${defaultPipeline.pipeline_id}/stages`, { credentials: 'include' });
        const stagesData = await stagesRes.json();
        setStages(stagesData);
      }
      
      if (oppData.org_id) {
        const orgRes = await fetch(`${API}/organizations/${oppData.org_id}`, { credentials: 'include' });
        const orgData = await orgRes.json();
        setOrganization(orgData);
      }
      
      if (oppData.primary_contact_id) {
        const contactRes = await fetch(`${API}/contacts/${oppData.primary_contact_id}`, { credentials: 'include' });
        const contactData = await contactRes.json();
        setContact(contactData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load opportunity');
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
      const response = await fetch(`${API}/opportunities/${oppId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData)
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      const updated = await response.json();
      setOpportunity(updated);
      setIsEditing(false);
      toast.success('Opportunity updated');
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this opportunity? This will also delete all related activities.')) return;
    
    try {
      const response = await fetch(`${API}/opportunities/${oppId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete');
      }
      
      toast.success('Opportunity deleted');
      navigate('/pipeline');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete');
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
          opp_id: oppId
        })
      });

      if (!response.ok) throw new Error('Failed to create');

      const created = await response.json();
      setActivities(prev => [...prev, created]);
      setIsActivityDialogOpen(false);
      setNewActivity({ activity_type: 'Call', due_date: '', notes: '' });
      toast.success('Activity created');
      
      // Refresh opportunity to update at-risk status
      const oppRes = await fetch(`${API}/opportunities/${oppId}`, { credentials: 'include' });
      const oppData = await oppRes.json();
      setOpportunity(oppData);
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    }
  };

  const handleCompleteActivity = async (activityId) => {
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

  const handleAICopilot = async (action) => {
    setAiLoading(action);
    setAiResponse(null);
    
    try {
      const response = await fetch(`${API}/ai/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          opp_id: oppId
        })
      });
      
      if (!response.ok) throw new Error('AI service error');
      
      const data = await response.json();
      setAiResponse({ action, result: data.result });
    } catch (error) {
      console.error('AI Copilot error:', error);
      toast.error('AI service temporarily unavailable');
    } finally {
      setAiLoading(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
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

  const currentStage = stages.find(s => s.stage_id === opportunity?.stage_id);

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

  if (!opportunity) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <p className="text-slate-500">Opportunity not found</p>
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
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pipeline')}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pipeline
            </Button>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    data-testid="save-opp-btn"
                    onClick={handleSave}
                    className="bg-ocean-950 hover:bg-ocean-900 rounded-full"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(opportunity);
                    }}
                    className="rounded-full"
                  >
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    data-testid="edit-opp-btn"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button
                    data-testid="delete-opp-btn"
                    variant="outline"
                    onClick={handleDelete}
                    className="rounded-full text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* At-Risk Banner */}
          {opportunity.is_at_risk && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">This opportunity is at risk</p>
                <p className="text-sm text-amber-600">No scheduled activity. Add one to keep this deal moving.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Opportunity Card */}
              <Card className="border-slate-200 shadow-soft">
                <CardHeader>
                  {isEditing ? (
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-heading font-semibold"
                    />
                  ) : (
                    <h1 className="text-2xl font-heading font-semibold text-slate-900">
                      {opportunity.name}
                    </h1>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-ocean-100 text-ocean-700">{opportunity.engagement_type}</Badge>
                    {currentStage && (
                      <Badge variant="secondary">{currentStage.name}</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Estimated Value ($)</Label>
                        <Input
                          type="number"
                          value={editData.estimated_value || 0}
                          onChange={(e) => setEditData(prev => ({ ...prev, estimated_value: parseFloat(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Confidence (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.confidence_level || 0}
                          onChange={(e) => setEditData(prev => ({ ...prev, confidence_level: parseInt(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Stage</Label>
                        <Select
                          value={editData.stage_id || ''}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, stage_id: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map(stage => (
                              <SelectItem key={stage.stage_id} value={stage.stage_id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Target Close Date</Label>
                        <Input
                          type="date"
                          value={editData.target_close_date?.split('T')[0] || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, target_close_date: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Owner</Label>
                        <Select
                          value={editData.owner_id || ''}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, owner_id: value }))}
                        >
                          <SelectTrigger data-testid="edit-opp-owner-select" className="mt-1">
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
                        <Label>Value Hypothesis</Label>
                        <Textarea
                          value={editData.value_hypothesis || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, value_hypothesis: e.target.value }))}
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs text-slate-500">Value</span>
                          </div>
                          <p className="text-xl font-heading font-semibold text-slate-900">
                            {formatCurrency(opportunity.estimated_value)}
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-ocean-600" />
                            <span className="text-xs text-slate-500">Confidence</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-heading font-semibold text-slate-900">
                              {opportunity.confidence_level}%
                            </p>
                            <Progress value={opportunity.confidence_level} className="flex-1 h-2" />
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-500">Close Date</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">
                            {opportunity.target_close_date 
                              ? new Date(opportunity.target_close_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '-'}
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-500">Source</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">
                            {opportunity.source || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Organization & Contact */}
                      <div className="grid grid-cols-2 gap-4">
                        {organization && (
                          <Link to={`/organizations/${organization.org_id}`}>
                            <div className="p-4 border border-slate-200 rounded-xl hover:border-ocean-300 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-ocean-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Organization</p>
                                  <p className="font-medium text-slate-900">{organization.name}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                        {contact && (
                          <Link to={`/contacts/${contact.contact_id}`}>
                            <div className="p-4 border border-slate-200 rounded-xl hover:border-ocean-300 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-ocean-100 rounded-full flex items-center justify-center">
                                  <span className="font-medium text-ocean-700">{contact.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Primary Contact</p>
                                  <p className="font-medium text-slate-900">{contact.name}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>

                      {/* Notes */}
                      {opportunity.notes && (
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-xs text-slate-500 mb-2">Notes</p>
                          <p className="text-sm text-slate-700">{opportunity.notes}</p>
                        </div>
                      )}

                      {/* Value Hypothesis */}
                      {opportunity.value_hypothesis && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-amber-600" />
                            <p className="text-xs font-medium text-amber-700">Value Hypothesis</p>
                          </div>
                          <p className="text-sm text-slate-700">{opportunity.value_hypothesis}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activities */}
              <Card className="border-slate-200 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-heading">Activities</CardTitle>
                  <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-activity-btn" size="sm" className="bg-ocean-950 hover:bg-ocean-900 rounded-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Activity
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-heading">Add Activity</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Activity Type</Label>
                          <Select
                            value={newActivity.activity_type}
                            onValueChange={(value) => setNewActivity(prev => ({ ...prev, activity_type: value }))}
                          >
                            <SelectTrigger data-testid="activity-type-select" className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Call">Call</SelectItem>
                              <SelectItem value="Meeting">Meeting</SelectItem>
                              <SelectItem value="Demo">Demo</SelectItem>
                              <SelectItem value="Workshop">Workshop</SelectItem>
                              <SelectItem value="Follow-up">Follow-up</SelectItem>
                              <SelectItem value="Exec Readout">Exec Readout</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input
                            data-testid="activity-date-input"
                            type="date"
                            value={newActivity.due_date}
                            onChange={(e) => setNewActivity(prev => ({ ...prev, due_date: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            data-testid="activity-notes-input"
                            value={newActivity.notes}
                            onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
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
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No activities yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activities
                        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                        .map(activity => {
                          const status = getActivityStatus(activity);
                          return (
                            <div
                              key={activity.activity_id}
                              className={`p-4 rounded-xl border ${
                                status === 'completed' ? 'bg-slate-50 border-slate-200' :
                                status === 'overdue' ? 'activity-red bg-red-50 border-red-200' :
                                status === 'today' ? 'activity-yellow bg-amber-50 border-amber-200' :
                                'activity-green border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900">{activity.activity_type}</span>
                                    <Badge variant="secondary" className={`text-xs ${
                                      status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                      status === 'overdue' ? 'bg-red-100 text-red-700' :
                                      status === 'today' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100'
                                    }`}>
                                      {status === 'completed' ? 'Completed' :
                                       status === 'overdue' ? 'Overdue' :
                                       status === 'today' ? 'Due Today' :
                                       new Date(activity.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </Badge>
                                  </div>
                                  {activity.notes && (
                                    <p className="text-sm text-slate-500 mt-1">{activity.notes}</p>
                                  )}
                                </div>
                                {status !== 'completed' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCompleteActivity(activity.activity_id)}
                                    className="text-emerald-600 hover:bg-emerald-50"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - AI Copilot */}
            <div className="space-y-6">
              <Card className="border-slate-200 shadow-soft sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    AI Sales Copilot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    data-testid="ai-summarize-btn"
                    variant="outline"
                    onClick={() => handleAICopilot('summarize')}
                    disabled={aiLoading !== null}
                    className="w-full justify-start rounded-xl border-slate-200 hover:bg-slate-50"
                  >
                    {aiLoading === 'summarize' ? (
                      <div className="w-4 h-4 border-2 border-ocean-600 border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2 text-slate-500" />
                    )}
                    Summarize Opportunity
                  </Button>
                  
                  <Button
                    data-testid="ai-suggest-btn"
                    variant="outline"
                    onClick={() => handleAICopilot('suggest_activity')}
                    disabled={aiLoading !== null}
                    className="w-full justify-start rounded-xl border-slate-200 hover:bg-slate-50"
                  >
                    {aiLoading === 'suggest_activity' ? (
                      <div className="w-4 h-4 border-2 border-ocean-600 border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Lightbulb className="w-4 h-4 mr-2 text-slate-500" />
                    )}
                    Suggest Next Activity
                  </Button>
                  
                  <Button
                    data-testid="ai-email-btn"
                    variant="outline"
                    onClick={() => handleAICopilot('draft_email')}
                    disabled={aiLoading !== null}
                    className="w-full justify-start rounded-xl border-slate-200 hover:bg-slate-50"
                  >
                    {aiLoading === 'draft_email' ? (
                      <div className="w-4 h-4 border-2 border-ocean-600 border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2 text-slate-500" />
                    )}
                    Draft Follow-up Email
                  </Button>
                  
                  <Button
                    data-testid="ai-hypothesis-btn"
                    variant="outline"
                    onClick={() => handleAICopilot('value_hypothesis')}
                    disabled={aiLoading !== null}
                    className="w-full justify-start rounded-xl border-slate-200 hover:bg-slate-50"
                  >
                    {aiLoading === 'value_hypothesis' ? (
                      <div className="w-4 h-4 border-2 border-ocean-600 border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Target className="w-4 h-4 mr-2 text-slate-500" />
                    )}
                    Generate Value Hypothesis
                  </Button>
                  
                  {/* AI Response */}
                  {aiResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 ai-response"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700 capitalize">
                          {aiResponse.action.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiResponse.result}</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default OpportunityDetail;
