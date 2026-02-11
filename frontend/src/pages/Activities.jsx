import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Users,
  Presentation,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesRes, oppsRes] = await Promise.all([
        fetch(`${API}/activities`, { credentials: 'include' }),
        fetch(`${API}/opportunities`, { credentials: 'include' })
      ]);
      
      const activitiesData = await activitiesRes.json();
      const oppsData = await oppsRes.json();
      
      setActivities(activitiesData);
      setOpportunities(oppsData);
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
      case 'Meeting': return Users;
      case 'Demo': return Presentation;
      case 'Workshop': return Users;
      default: return MessageSquare;
    }
  };

  const filterActivities = (status) => {
    return activities
      .filter(a => {
        const actStatus = getActivityStatus(a);
        if (status === 'upcoming') return actStatus === 'upcoming' || actStatus === 'today';
        if (status === 'overdue') return actStatus === 'overdue';
        if (status === 'completed') return actStatus === 'completed';
        return true;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  };

  const overdueCount = activities.filter(a => getActivityStatus(a) === 'overdue').length;
  const todayCount = activities.filter(a => getActivityStatus(a) === 'today').length;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
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
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-semibold text-slate-900">Activities</h1>
            <p className="text-slate-500 mt-1">Manage your sales activities</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className={`border-slate-200 shadow-soft ${todayCount > 0 ? 'ring-2 ring-amber-200' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Due Today</p>
                    <p className="text-2xl font-heading font-semibold text-slate-900">{todayCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-slate-200 shadow-soft ${overdueCount > 0 ? 'ring-2 ring-red-200' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Overdue</p>
                    <p className="text-2xl font-heading font-semibold text-slate-900">{overdueCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Completed (All Time)</p>
                    <p className="text-2xl font-heading font-semibold text-slate-900">
                      {activities.filter(a => a.status === 'Completed').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activities Tabs */}
          <Card className="border-slate-200 shadow-soft">
            <CardContent className="p-6">
              <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="upcoming" data-testid="activities-upcoming-tab">
                    Upcoming {todayCount > 0 && <Badge className="ml-2 bg-amber-100 text-amber-700">{todayCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="overdue" data-testid="activities-overdue-tab">
                    Overdue {overdueCount > 0 && <Badge className="ml-2 bg-red-100 text-red-700">{overdueCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="completed" data-testid="activities-completed-tab">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  <ActivityList
                    activities={filterActivities('upcoming')}
                    opportunities={opportunities}
                    onComplete={handleComplete}
                    getActivityIcon={getActivityIcon}
                    getActivityStatus={getActivityStatus}
                  />
                </TabsContent>

                <TabsContent value="overdue">
                  <ActivityList
                    activities={filterActivities('overdue')}
                    opportunities={opportunities}
                    onComplete={handleComplete}
                    getActivityIcon={getActivityIcon}
                    getActivityStatus={getActivityStatus}
                  />
                </TabsContent>

                <TabsContent value="completed">
                  <ActivityList
                    activities={filterActivities('completed')}
                    opportunities={opportunities}
                    onComplete={handleComplete}
                    getActivityIcon={getActivityIcon}
                    getActivityStatus={getActivityStatus}
                    showComplete={false}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

const ActivityList = ({ activities, opportunities, onComplete, getActivityIcon, getActivityStatus, showComplete = true }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">No activities</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const opp = opportunities.find(o => o.opp_id === activity.opp_id);
        const status = getActivityStatus(activity);
        const Icon = getActivityIcon(activity.activity_type);
        
        return (
          <motion.div
            key={activity.activity_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-xl border ${
              status === 'completed' ? 'bg-slate-50 border-slate-200' :
              status === 'overdue' ? 'activity-red bg-red-50 border-red-200' :
              status === 'today' ? 'activity-yellow bg-amber-50 border-amber-200' :
              'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  status === 'completed' ? 'bg-emerald-100' :
                  status === 'overdue' ? 'bg-red-100' :
                  status === 'today' ? 'bg-amber-100' :
                  'bg-ocean-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    status === 'completed' ? 'text-emerald-600' :
                    status === 'overdue' ? 'text-red-600' :
                    status === 'today' ? 'text-amber-600' :
                    'text-ocean-600'
                  }`} />
                </div>
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
                  {opp && (
                    <Link to={`/opportunities/${opp.opp_id}`} className="text-sm text-ocean-600 hover:underline mt-2 inline-block">
                      {opp.name}
                    </Link>
                  )}
                </div>
              </div>
              {showComplete && status !== 'completed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onComplete(activity.activity_id)}
                  className="text-emerald-600 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Activities;
