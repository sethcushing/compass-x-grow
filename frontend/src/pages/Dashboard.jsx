import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  Clock,
  Building2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Video,
  Presentation,
  FileText,
  MessageSquare,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Activity type config with colors and icons
const ACTIVITY_CONFIG = {
  'Call': { icon: Phone, color: 'bg-blue-100 text-blue-600', border: 'border-l-blue-500' },
  'Email': { icon: Mail, color: 'bg-purple-100 text-purple-600', border: 'border-l-purple-500' },
  'Meeting': { icon: Video, color: 'bg-emerald-100 text-emerald-600', border: 'border-l-emerald-500' },
  'Demo': { icon: Presentation, color: 'bg-orange-100 text-orange-600', border: 'border-l-orange-500' },
  'Workshop': { icon: Users, color: 'bg-pink-100 text-pink-600', border: 'border-l-pink-500' },
  'Discovery Session': { icon: MessageSquare, color: 'bg-cyan-100 text-cyan-600', border: 'border-l-cyan-500' },
  'Follow-up': { icon: Clock, color: 'bg-amber-100 text-amber-600', border: 'border-l-amber-500' },
  'Exec Readout': { icon: FileText, color: 'bg-indigo-100 text-indigo-600', border: 'border-l-indigo-500' },
  'Other': { icon: FileText, color: 'bg-slate-100 text-slate-600', border: 'border-l-slate-500' }
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, userRes, orgsRes] = await Promise.all([
          fetch(`${API}/dashboard/sales`, { credentials: 'include' }),
          fetch(`${API}/auth/me`, { credentials: 'include' }),
          fetch(`${API}/organizations`, { credentials: 'include' })
        ]);
        
        const dashData = await dashRes.json();
        const userData = await userRes.json();
        const orgsData = await orgsRes.json();
        
        setData(dashData);
        setUser(userData);
        setOrganizations(orgsData);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'today': return 'text-amber-600 bg-amber-50';
      default: return 'text-ocean-600 bg-ocean-50';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { metrics, opportunities, activities, stages, users } = data || {};
  
  // Helper to get user name by ID
  const getUserName = (userId) => {
    const u = (users || []).find(u => u.user_id === userId);
    return u?.name || 'Unknown';
  };
  
  // Helper to get org name by ID
  const getOrgName = (orgId) => {
    const org = organizations.find(o => o.org_id === orgId);
    return org?.name || 'Unknown Client';
  };
  
  // Count at-risk clients
  const atRiskClients = organizations.filter(o => o.is_at_risk).length;
  
  const upcomingActivities = (activities || [])
    .filter(a => a.status !== 'Completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  // Group opportunities by client for "Top Opportunities by Client"
  const opportunitiesByClient = {};
  (opportunities || []).forEach(opp => {
    const orgId = opp.org_id || 'unknown';
    if (!opportunitiesByClient[orgId]) {
      opportunitiesByClient[orgId] = {
        org_id: orgId,
        org_name: getOrgName(orgId),
        opportunities: [],
        total_value: 0
      };
    }
    opportunitiesByClient[orgId].opportunities.push(opp);
    opportunitiesByClient[orgId].total_value += opp.estimated_value || 0;
  });
  
  // Sort by total value and take top 5 clients
  const topClientOpportunities = Object.values(opportunitiesByClient)
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 5);

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
              <h1 className="text-3xl font-heading font-semibold text-slate-900">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-slate-500 mt-1">Here's what's happening with your pipeline</p>
            </div>
            <Link to="/pipeline">
              <Button data-testid="view-pipeline-btn" className="bg-ocean-950 hover:bg-ocean-900 rounded-full">
                View Pipeline <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Metrics Grid - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-slate-200 shadow-soft hover:shadow-hover transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-ocean-600" />
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                      {metrics?.total_opportunities || 0} deals
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Total Pipeline</p>
                  <p className="text-2xl font-heading font-semibold text-slate-900">
                    {formatCurrency(metrics?.total_value)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-slate-200 shadow-soft hover:shadow-hover transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-secondary/30 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-ocean-700" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Weighted Forecast</p>
                  <p className="text-2xl font-heading font-semibold text-slate-900">
                    {formatCurrency(metrics?.weighted_forecast)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className={`border-slate-200 shadow-soft hover:shadow-hover transition-shadow ${
                metrics?.overdue_activities > 0 ? 'ring-2 ring-red-200' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      metrics?.overdue_activities > 0 ? 'bg-red-100' : 'bg-slate-100'
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        metrics?.overdue_activities > 0 ? 'text-red-600' : 'text-slate-600'
                      }`} />
                    </div>
                    {metrics?.overdue_activities > 0 && (
                      <Badge variant="destructive">Action Needed</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Overdue Activities</p>
                  <p className="text-2xl font-heading font-semibold text-slate-900">
                    {metrics?.overdue_activities || 0}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className={`border-slate-200 shadow-soft hover:shadow-hover transition-shadow ${
                (metrics?.at_risk_opportunities > 0 || atRiskClients > 0) ? 'ring-2 ring-amber-200' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      (metrics?.at_risk_opportunities > 0 || atRiskClients > 0) ? 'bg-amber-100' : 'bg-slate-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        (metrics?.at_risk_opportunities > 0 || atRiskClients > 0) ? 'text-amber-600' : 'text-slate-600'
                      }`} />
                    </div>
                    {atRiskClients > 0 && (
                      <Badge className="bg-rose-100 text-rose-700">{atRiskClients} clients</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-1">At-Risk Deals</p>
                  <p className="text-2xl font-heading font-semibold text-slate-900">
                    {metrics?.at_risk_opportunities || 0}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Activities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-1"
            >
              <Card className="border-slate-200 shadow-soft h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-heading">Upcoming Activities</CardTitle>
                    <Link to="/activities">
                      <Button variant="ghost" size="sm" className="text-ocean-600">View all</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingActivities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming activities</p>
                    </div>
                  ) : (
                    upcomingActivities.map((activity) => {
                      const status = getActivityStatus(activity);
                      const config = ACTIVITY_CONFIG[activity.activity_type] || ACTIVITY_CONFIG['Other'];
                      const IconComponent = config.icon;
                      return (
                        <div
                          key={activity.activity_id}
                          className={`p-3 rounded-lg border-l-4 ${config.border} bg-white shadow-sm`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900">
                                {activity.title || activity.activity_type}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{activity.notes || 'No notes'}</p>
                            </div>
                            <Badge className={getStatusColor(status)} variant="secondary">
                              {status === 'overdue' ? 'Overdue' :
                               status === 'today' ? 'Today' :
                               new Date(activity.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Opportunities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2"
            >
              <Card className="border-slate-200 shadow-soft h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-heading">Top Opportunities</CardTitle>
                    <Link to="/pipeline">
                      <Button variant="ghost" size="sm" className="text-ocean-600">View pipeline</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topOpportunities.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No opportunities yet</p>
                      </div>
                    ) : (
                      topOpportunities.map((opp) => {
                        const stage = stages?.find(s => s.stage_id === opp.stage_id);
                        return (
                          <Link
                            key={opp.opp_id}
                            to={`/opportunities/${opp.opp_id}`}
                            className="block"
                          >
                            <div className="p-4 rounded-xl border border-slate-200 hover:border-ocean-300 hover:shadow-soft transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-slate-900">{opp.name}</h4>
                                  <p className="text-sm text-slate-500">{opp.engagement_type}</p>
                                  <p className="text-xs text-slate-400 mt-1">Owner: {getUserName(opp.owner_id)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-heading font-semibold text-ocean-950">
                                    {formatCurrency(opp.estimated_value)}
                                  </p>
                                  <p className="text-xs text-slate-500">{opp.confidence_level}% confidence</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-slate-100">
                                  {stage?.name || 'Unknown Stage'}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Progress value={opp.confidence_level} className="w-20 h-2" />
                                  {opp.is_at_risk && (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Pipeline Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6"
          >
            <Card className="border-slate-200 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-heading">Pipeline by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(stages || []).filter(s => !s.name.includes('Closed')).map((stage) => {
                    const stageOpps = (opportunities || []).filter(o => o.stage_id === stage.stage_id);
                    const value = stageOpps.reduce((sum, o) => sum + (o.estimated_value || 0), 0);
                    return (
                      <div
                        key={stage.stage_id}
                        className="flex-1 min-w-[140px] p-4 bg-slate-50 rounded-xl"
                      >
                        <p className="text-xs text-slate-500 mb-1 truncate">{stage.name}</p>
                        <p className="font-heading font-semibold text-slate-900">
                          {formatCurrency(value)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{stageOpps.length} deals</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
