import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target,
  AlertTriangle, 
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
import { useTheme } from '@/context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ACTIVITY_CONFIG = {
  'Call': { icon: Phone, color: 'from-blue-50 to-blue-100', iconColor: 'text-blue-600', bgColor: 'bg-blue-100' },
  'Email': { icon: Mail, color: 'from-purple-50 to-purple-100', iconColor: 'text-purple-600', bgColor: 'bg-purple-100' },
  'Meeting': { icon: Video, color: 'from-emerald-50 to-emerald-100', iconColor: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  'Demo': { icon: Presentation, color: 'from-orange-50 to-orange-100', iconColor: 'text-orange-600', bgColor: 'bg-orange-100' },
  'Workshop': { icon: Users, color: 'from-pink-50 to-pink-100', iconColor: 'text-pink-600', bgColor: 'bg-pink-100' },
  'Discovery Session': { icon: MessageSquare, color: 'from-cyan-50 to-cyan-100', iconColor: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  'Follow-up': { icon: Clock, color: 'from-amber-50 to-amber-100', iconColor: 'text-amber-600', bgColor: 'bg-amber-100' },
  'Exec Readout': { icon: FileText, color: 'from-indigo-50 to-indigo-100', iconColor: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  'Other': { icon: FileText, color: 'from-slate-50 to-slate-100', iconColor: 'text-slate-600', bgColor: 'bg-slate-100' }
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${className}`}>
    {children}
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [reportsSummary, setReportsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, userRes, orgsRes, reportsRes] = await Promise.all([
          fetch(`${API}/dashboard/sales`, { credentials: 'include' }),
          fetch(`${API}/auth/me`, { credentials: 'include' }),
          fetch(`${API}/organizations`, { credentials: 'include' }),
          fetch(`${API}/reports/summary`, { credentials: 'include' })
        ]);
        
        const dashData = await dashRes.json();
        const userData = await userRes.json();
        const orgsData = await orgsRes.json();
        const reportsData = reportsRes.ok ? await reportsRes.json() : null;
        
        setData(dashData);
        setUser(userData);
        setOrganizations(orgsData);
        setReportsSummary(reportsData);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatCurrency = (value) => {
    if (!value) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate at-risk clients
  const atRiskClients = organizations.filter(org => {
    const lastActivity = data?.activities?.find(a => a.org_id === org.org_id);
    if (!lastActivity) return true;
    const daysSince = Math.floor((new Date() - new Date(lastActivity.due_date)) / (1000 * 60 * 60 * 24));
    return daysSince > 7;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded-xl w-64" />
            <div className="grid grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const metrics = data?.metrics;
  const activities = data?.activities?.slice(0, 5) || [];

  // Group opportunities by client
  const oppsByClient = {};
  data?.opportunities?.forEach(opp => {
    const org = organizations.find(o => o.org_id === opp.org_id);
    const orgName = org?.name || 'Unknown';
    if (!oppsByClient[orgName]) {
      oppsByClient[orgName] = { opps: [], totalValue: 0 };
    }
    oppsByClient[orgName].opps.push(opp);
    oppsByClient[orgName].totalValue += opp.estimated_value || 0;
  });

  const sortedClients = Object.entries(oppsByClient)
    .sort((a, b) => b[1].totalValue - a[1].totalValue)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-slate-500 mt-1">Here's what's happening with your pipeline</p>
            </div>
            <Link to="/pipeline">
              <Button className="bg-ocean-600 hover:bg-ocean-700 text-white font-semibold rounded-xl shadow-lg shadow-ocean-600/20 transition-all">
                View Pipeline
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-ocean-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-ocean-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {metrics?.total_opportunities || 0} deals
                  </Badge>
                </div>
                <p className="text-slate-500 text-sm mb-1">Total Pipeline</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(metrics?.total_value)}</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm mb-1">Avg Confidence</p>
                <p className="text-2xl font-bold text-slate-800">{metrics?.avg_confidence || 0}%</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className={`p-6 ${metrics?.overdue_activities > 0 ? 'ring-2 ring-red-200' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    metrics?.overdue_activities > 0 ? 'bg-red-100' : 'bg-slate-100'
                  }`}>
                    <Clock className={`w-6 h-6 ${metrics?.overdue_activities > 0 ? 'text-red-600' : 'text-slate-500'}`} />
                  </div>
                  {metrics?.overdue_activities > 0 && (
                    <Badge className="bg-red-100 text-red-700 border-0">Action Needed</Badge>
                  )}
                </div>
                <p className="text-slate-500 text-sm mb-1">Overdue Activities</p>
                <p className="text-2xl font-bold text-slate-800">{metrics?.overdue_activities || 0}</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className={`p-6 ${(metrics?.at_risk_opportunities > 0 || atRiskClients > 0) ? 'ring-2 ring-amber-200' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    (metrics?.at_risk_opportunities > 0 || atRiskClients > 0) ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${(metrics?.at_risk_opportunities > 0 || atRiskClients > 0) ? 'text-amber-600' : 'text-slate-500'}`} />
                  </div>
                  {atRiskClients > 0 && (
                    <Badge className="bg-rose-100 text-rose-700 border-0">{atRiskClients} clients</Badge>
                  )}
                </div>
                <p className="text-slate-500 text-sm mb-1">At-Risk Deals</p>
                <p className="text-2xl font-bold text-slate-800">{metrics?.at_risk_opportunities || 0}</p>
              </Card>
            </motion.div>
          </div>

          {/* Won/Lost/Active/Pipeline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6" data-testid="dashboard-won-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {reportsSummary?.won?.count || 0} deals
                  </Badge>
                </div>
                <p className="text-slate-500 text-sm mb-1">Won (Closed)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(reportsSummary?.won?.value)}</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="p-6" data-testid="dashboard-lost-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-rose-600" />
                  </div>
                  <Badge className="bg-rose-100 text-rose-700 border-0">
                    {reportsSummary?.lost?.count || 0} deals
                  </Badge>
                </div>
                <p className="text-slate-500 text-sm mb-1">Lost (Closed)</p>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(reportsSummary?.lost?.value)}</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6" data-testid="dashboard-active-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0">
                    {reportsSummary?.active?.count || 0} deals
                  </Badge>
                </div>
                <p className="text-slate-500 text-sm mb-1">Active (Closed Won)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(reportsSummary?.active?.value)}</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="p-6" data-testid="dashboard-pipeline-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-0">
                    {reportsSummary?.pipeline?.count || 0} deals
                  </Badge>
                </div>
                <p className="text-slate-500 text-sm mb-1">Pipeline (Open)</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportsSummary?.pipeline?.value)}</p>
              </Card>
            </motion.div>
          </div>

          {/* Activities and Top Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Activities */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-slate-800">Upcoming Activities</h2>
                  <Link to="/activities" className="text-ocean-600 text-sm hover:text-ocean-700 transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No upcoming activities</p>
                  ) : (
                    activities.map((activity) => {
                      const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG['Other'];
                      const Icon = config.icon;
                      return (
                        <div
                          key={activity.activity_id}
                          className={`flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r ${config.color} border border-slate-100`}
                        >
                          <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-700 text-sm truncate">{activity.title || activity.type}</p>
                            <p className="text-slate-500 text-xs truncate">{activity.notes || 'No notes'}</p>
                          </div>
                          <Badge className="bg-white text-slate-600 border border-slate-200 text-xs">
                            {formatDate(activity.due_date)}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Top Opportunities by Client */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-slate-800">Top Opportunities by Client</h2>
                  <Link to="/pipeline" className="text-ocean-600 text-sm hover:text-ocean-700 transition-colors">
                    View pipeline
                  </Link>
                </div>
                <div className="space-y-4">
                  {sortedClients.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No opportunities yet</p>
                  ) : (
                    sortedClients.map(([clientName, clientData]) => (
                      <div key={clientName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-ocean-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-ocean-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-700 text-sm">{clientName}</p>
                              <p className="text-slate-400 text-xs">{clientData.opps.length} opportunities</p>
                            </div>
                          </div>
                          <p className="font-semibold text-ocean-600">{formatCurrency(clientData.totalValue)}</p>
                        </div>
                        <div className="ml-11 space-y-1">
                          {clientData.opps.slice(0, 3).map(opp => {
                            const stage = data?.stages?.find(s => s.stage_id === opp.stage_id);
                            return (
                              <Link 
                                key={opp.opp_id} 
                                to={`/opportunities/${opp.opp_id}`}
                                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                              >
                                <span className="text-slate-600 text-xs truncate">{opp.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 text-xs">{stage?.name || ''}</span>
                                  <span className="text-slate-700 font-medium text-xs">{formatCurrency(opp.estimated_value)}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
