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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ACTIVITY_CONFIG = {
  'Call': { icon: Phone, color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
  'Email': { icon: Mail, color: 'from-purple-500/20 to-purple-600/10', iconColor: 'text-purple-400' },
  'Meeting': { icon: Video, color: 'from-emerald-500/20 to-emerald-600/10', iconColor: 'text-emerald-400' },
  'Demo': { icon: Presentation, color: 'from-orange-500/20 to-orange-600/10', iconColor: 'text-orange-400' },
  'Workshop': { icon: Users, color: 'from-pink-500/20 to-pink-600/10', iconColor: 'text-pink-400' },
  'Discovery Session': { icon: MessageSquare, color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
  'Follow-up': { icon: Clock, color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400' },
  'Exec Readout': { icon: FileText, color: 'from-indigo-500/20 to-indigo-600/10', iconColor: 'text-indigo-400' },
  'Other': { icon: FileText, color: 'from-slate-500/20 to-slate-600/10', iconColor: 'text-slate-400' }
};

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-ocean-900 flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded-xl w-64" />
            <div className="grid grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-ocean-900 flex">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ocean-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-ocean-400/10 rounded-full blur-3xl" />
      </div>

      <Sidebar />
      
      <main className="flex-1 p-8 overflow-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-white/50 mt-1">Here's what's happening with your pipeline</p>
            </div>
            <Link to="/pipeline">
              <Button className="bg-gradient-to-r from-secondary to-yellow-400 text-slate-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-secondary/25 transition-all">
                View Pipeline
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-ocean-400/20 to-ocean-600/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-ocean-400" />
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    {metrics?.total_opportunities || 0} deals
                  </Badge>
                </div>
                <p className="text-white/50 text-sm mb-1">Total Pipeline</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(metrics?.total_value)}</p>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-amber-600/10 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <p className="text-white/50 text-sm mb-1">Avg Confidence</p>
                <p className="text-2xl font-bold text-white">{metrics?.avg_confidence || 0}%</p>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard className={`p-6 ${metrics?.overdue_activities > 0 ? 'ring-1 ring-red-500/30' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    metrics?.overdue_activities > 0 
                      ? 'bg-gradient-to-br from-red-400/20 to-red-600/10' 
                      : 'bg-gradient-to-br from-slate-400/20 to-slate-600/10'
                  }`}>
                    <Clock className={`w-6 h-6 ${metrics?.overdue_activities > 0 ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  {metrics?.overdue_activities > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-0">Action Needed</Badge>
                  )}
                </div>
                <p className="text-white/50 text-sm mb-1">Overdue Activities</p>
                <p className="text-2xl font-bold text-white">{metrics?.overdue_activities || 0}</p>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <GlassCard className={`p-6 ${(metrics?.at_risk_opportunities > 0 || atRiskClients > 0) ? 'ring-1 ring-amber-500/30' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    (metrics?.at_risk_opportunities > 0 || atRiskClients > 0)
                      ? 'bg-gradient-to-br from-amber-400/20 to-amber-600/10' 
                      : 'bg-gradient-to-br from-slate-400/20 to-slate-600/10'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${(metrics?.at_risk_opportunities > 0 || atRiskClients > 0) ? 'text-amber-400' : 'text-slate-400'}`} />
                  </div>
                  {atRiskClients > 0 && (
                    <Badge className="bg-rose-500/20 text-rose-400 border-0">{atRiskClients} clients</Badge>
                  )}
                </div>
                <p className="text-white/50 text-sm mb-1">At-Risk Deals</p>
                <p className="text-2xl font-bold text-white">{metrics?.at_risk_opportunities || 0}</p>
              </GlassCard>
            </motion.div>
          </div>

          {/* Won/Lost/Active/Pipeline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard className="p-6" data-testid="dashboard-won-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    {reportsSummary?.won?.count || 0} deals
                  </Badge>
                </div>
                <p className="text-white/50 text-sm mb-1">Won (Closed)</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(reportsSummary?.won?.value)}</p>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <GlassCard className="p-6" data-testid="dashboard-lost-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400/20 to-rose-600/10 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-rose-400" />
                  </div>
                  <Badge className="bg-rose-500/20 text-rose-400 border-0">
                    {reportsSummary?.lost?.count || 0} deals
                  </Badge>
                </div>
                <p className="text-white/50 text-sm mb-1">Lost (Closed)</p>
                <p className="text-2xl font-bold text-rose-400">{formatCurrency(reportsSummary?.lost?.value)}</p>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <GlassCard className="p-6" data-testid="dashboard-active-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/10 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-0">
                    {reportsSummary?.active?.count || 0} deals
                  </Badge>
                </div>
                <p className="text-white/50 text-sm mb-1">Active (Closed Won)</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(reportsSummary?.active?.value)}</p>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <GlassCard className="p-6" data-testid="dashboard-pipeline-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-600/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-0">
                    {reportsSummary?.pipeline?.count || 0} deals
                  </Badge>
                </div>
                <p className="text-white/50 text-sm mb-1">Pipeline (Open)</p>
                <p className="text-2xl font-bold text-blue-400">{formatCurrency(reportsSummary?.pipeline?.value)}</p>
              </GlassCard>
            </motion.div>
          </div>

          {/* Activities and Top Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Activities */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-white">Upcoming Activities</h2>
                  <Link to="/activities" className="text-secondary text-sm hover:text-secondary/80 transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-8">No upcoming activities</p>
                  ) : (
                    activities.map((activity) => {
                      const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG['Other'];
                      const Icon = config.icon;
                      return (
                        <div
                          key={activity.activity_id}
                          className={`flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r ${config.color} border border-white/5`}
                        >
                          <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{activity.title || activity.type}</p>
                            <p className="text-white/50 text-xs truncate">{activity.notes || 'No notes'}</p>
                          </div>
                          <Badge className="bg-white/10 text-white/70 border-0 text-xs">
                            {formatDate(activity.due_date)}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Top Opportunities by Client */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-white">Top Opportunities by Client</h2>
                  <Link to="/pipeline" className="text-secondary text-sm hover:text-secondary/80 transition-colors">
                    View pipeline
                  </Link>
                </div>
                <div className="space-y-4">
                  {sortedClients.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-8">No opportunities yet</p>
                  ) : (
                    sortedClients.map(([clientName, clientData]) => (
                      <div key={clientName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-ocean-400/20 to-ocean-600/10 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-ocean-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{clientName}</p>
                              <p className="text-white/40 text-xs">{clientData.opps.length} opportunities</p>
                            </div>
                          </div>
                          <p className="font-semibold text-secondary">{formatCurrency(clientData.totalValue)}</p>
                        </div>
                        <div className="ml-11 space-y-1">
                          {clientData.opps.slice(0, 3).map(opp => {
                            const stage = data?.stages?.find(s => s.stage_id === opp.stage_id);
                            return (
                              <Link 
                                key={opp.opp_id} 
                                to={`/opportunities/${opp.opp_id}`}
                                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <span className="text-white/70 text-xs truncate">{opp.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white/50 text-xs">{stage?.name || ''}</span>
                                  <span className="text-white font-medium text-xs">{formatCurrency(opp.estimated_value)}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
