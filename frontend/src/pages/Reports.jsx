import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  DollarSign,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#0ea5e9', '#8ECAE6', '#FFB703', '#FB8500', '#E63946', '#2A9D8F', '#023047'];
const DARK_COLORS = ['#38bdf8', '#7dd3fc', '#fbbf24', '#f97316', '#f43f5e', '#34d399', '#06b6d4'];

const GlassCard = ({ children, className = '', glow = false }) => {
  const { theme } = useTheme();
  return (
    <div className={`
      relative overflow-hidden rounded-2xl
      ${theme === 'dark' 
        ? 'bg-white/5 border border-white/10 backdrop-blur-xl' 
        : 'bg-white/80 border border-slate-200/50 backdrop-blur-sm shadow-lg shadow-slate-200/50'
      }
      ${glow && theme === 'dark' ? 'glow-primary' : ''}
      ${className}
    `}>
      {theme === 'dark' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'ocean', delay = 0 }) => {
  const { theme } = useTheme();
  
  const colorClasses = {
    ocean: theme === 'dark' 
      ? 'bg-ocean-500/20 text-ocean-400 ring-1 ring-ocean-500/30' 
      : 'bg-ocean-100 text-ocean-600',
    emerald: theme === 'dark' 
      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' 
      : 'bg-emerald-100 text-emerald-600',
    amber: theme === 'dark' 
      ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' 
      : 'bg-amber-100 text-amber-600',
    rose: theme === 'dark' 
      ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30' 
      : 'bg-rose-100 text-rose-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard className="p-6" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

const Reports = () => {
  const [pipelineData, setPipelineData] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    try {
      const meRes = await fetch(`${API}/auth/me`, { credentials: 'include' });
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData);
      }
      
      const ownerParam = viewMode === 'mine' && currentUser ? `?owner_id=${currentUser.user_id}` : '';
      
      const [pipelineRes, engagementRes, ownerRes, summaryRes] = await Promise.all([
        fetch(`${API}/analytics/pipeline${ownerParam}`, { credentials: 'include' }),
        fetch(`${API}/analytics/engagement-types${ownerParam}`, { credentials: 'include' }),
        fetch(`${API}/analytics/by-owner`, { credentials: 'include' }),
        fetch(`${API}/analytics/summary${ownerParam}`, { credentials: 'include' })
      ]);
      
      const pipeline = await pipelineRes.json();
      const engagement = await engagementRes.json();
      const owners = await ownerRes.json();
      const summaryData = await summaryRes.json();
      
      setPipelineData(pipeline);
      setEngagementData(engagement);
      setOwnerData(owners);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const chartColors = theme === 'dark' ? DARK_COLORS : COLORS;
  const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748B';
  const labelColor = theme === 'dark' ? '#e2e8f0' : '#334155';

  if (loading) {
    return (
      <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className={`h-8 w-48 rounded ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-28 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-200'}`}></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-slate-950 gradient-mesh' : 'bg-slate-50'}`}>
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-ocean-500/20' : 'bg-ocean-100'}`}>
                  <Sparkles className={`w-5 h-5 ${theme === 'dark' ? 'text-ocean-400' : 'text-ocean-600'}`} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 ml-12">Pipeline and sales performance insights</p>
            </motion.div>
            
            {/* View Toggle */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center rounded-full p-1 ${
                theme === 'dark' 
                  ? 'bg-white/5 border border-white/10' 
                  : 'bg-slate-100'
              }`}
            >
              <button
                data-testid="reports-view-all"
                onClick={() => setViewMode('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'all' 
                    ? theme === 'dark'
                      ? 'bg-ocean-500/30 text-ocean-300 shadow-lg shadow-ocean-500/20' 
                      : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                data-testid="reports-view-mine"
                onClick={() => setViewMode('mine')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'mine' 
                    ? theme === 'dark'
                      ? 'bg-ocean-500/30 text-ocean-300 shadow-lg shadow-ocean-500/20' 
                      : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                My
              </button>
            </motion.div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard 
              title="Total Pipeline" 
              value={formatCurrency(summary?.total_pipeline_value || 0)}
              subtitle={`${summary?.total_deals || 0} deals`}
              icon={DollarSign}
              color="ocean"
              delay={0.1}
            />
            <MetricCard 
              title="Weighted Forecast" 
              value={formatCurrency(summary?.weighted_forecast || 0)}
              subtitle="Based on confidence"
              icon={Target}
              color="emerald"
              delay={0.15}
            />
            <MetricCard 
              title="Win Rate" 
              value={`${summary?.win_rate || 0}%`}
              subtitle={`${summary?.won_deals || 0} won, ${summary?.lost_deals || 0} lost`}
              icon={TrendingUp}
              color="amber"
              delay={0.2}
            />
            <MetricCard 
              title="At Risk" 
              value={summary?.at_risk_deals || 0}
              subtitle={`${summary?.overdue_activities || 0} overdue activities`}
              icon={AlertTriangle}
              color="rose"
              delay={0.25}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pipeline by Stage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6" glow>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Pipeline by Stage</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fill: textColor, fontSize: 12 }}
                      />
                      <YAxis 
                        dataKey="stage" 
                        type="category" 
                        width={150}
                        tick={{ fill: labelColor, fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name === 'value' ? 'Total Value' : 'Weighted']}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'white',
                          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                          color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill={chartColors[0]}
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* Engagement Types */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <GlassCard className="p-6" glow>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Engagement Types</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="type"
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'white',
                          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                          color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ color: labelColor }}
                        formatter={(value) => <span className="text-slate-600 dark:text-slate-300 text-sm">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Owner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6" glow>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Pipeline by Owner</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ownerData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis 
                        dataKey="owner" 
                        tick={{ fill: labelColor, fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fill: textColor, fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'white',
                          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                          color: theme === 'dark' ? '#e2e8f0' : '#1e293b'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={chartColors[0]} 
                        strokeWidth={2}
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <GlassCard className="p-6 h-full" glow>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Quick Stats</h3>
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-300">Average Deal Size</span>
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency((summary?.total_pipeline_value || 0) / Math.max(summary?.total_deals || 1, 1))}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-ocean-500/10 border border-ocean-500/20' : 'bg-ocean-50 border border-ocean-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-300">Deals in Pipeline</span>
                      <span className="text-xl font-bold text-ocean-600 dark:text-ocean-400">{summary?.total_deals || 0}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-300">Won This Period</span>
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary?.won_deals || 0}</span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-300">Lost This Period</span>
                      <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{summary?.lost_deals || 0}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Reports;
