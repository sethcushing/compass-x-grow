import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  Users,
  AlertTriangle,
  Trophy,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ExecutiveDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API}/dashboard/executive`, { credentials: 'include' });
      const dashData = await response.json();
      setData(dashData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-slate-200 rounded"></div>
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

  const { metrics, opportunities, stages, users, by_stage, by_owner } = data || {};

  // Prepare chart data
  const stageChartData = (stages || [])
    .filter(s => !s.name.includes('Closed'))
    .map(stage => {
      const stageData = by_stage?.[stage.stage_id] || { count: 0, value: 0 };
      return {
        name: stage.name.split('/')[0].trim(),
        value: stageData.value,
        count: stageData.count
      };
    });

  // Top opportunities
  const topOpportunities = (opportunities || [])
    .filter(o => !o.stage_id?.includes('closed'))
    .sort((a, b) => b.estimated_value - a.estimated_value)
    .slice(0, 5);

  // At-risk opportunities
  const atRiskOpportunities = (opportunities || [])
    .filter(o => o.is_at_risk)
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
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-semibold text-slate-900">Executive Dashboard</h1>
            <p className="text-slate-500 mt-1">Pipeline health and revenue forecast overview</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-slate-200 shadow-soft bg-gradient-to-br from-ocean-950 to-ocean-800 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-6 h-6 text-secondary" />
                    <Badge className="bg-white/20 text-white">{metrics?.total_deals || 0} deals</Badge>
                  </div>
                  <p className="text-ocean-200 text-sm">Total Pipeline</p>
                  <p className="text-3xl font-heading font-semibold mt-1">
                    {formatCurrency(metrics?.total_pipeline_value)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-slate-200 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-secondary/30 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-ocean-700" />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">Weighted Forecast</p>
                  <p className="text-3xl font-heading font-semibold text-slate-900 mt-1">
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
              <Card className="border-slate-200 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-emerald-600" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">{metrics?.won_deals || 0} won</Badge>
                  </div>
                  <p className="text-slate-500 text-sm">Win Rate</p>
                  <p className="text-3xl font-heading font-semibold text-slate-900 mt-1">
                    {metrics?.win_rate || 0}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-slate-200 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    {atRiskOpportunities.length > 0 && (
                      <Badge variant="destructive">{atRiskOpportunities.length}</Badge>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm">Deals Lost</p>
                  <p className="text-3xl font-heading font-semibold text-slate-900 mt-1">
                    {metrics?.lost_deals || 0}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pipeline by Stage Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2"
            >
              <Card className="border-slate-200 shadow-soft h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-heading">Pipeline Value by Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stageChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#64748B', fontSize: 11 }}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value)}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [formatCurrency(value), 'Value']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#023047" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* At-Risk Deals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-slate-200 shadow-soft h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    At-Risk Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {atRiskOpportunities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">No at-risk deals</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {atRiskOpportunities.map(opp => (
                        <Link key={opp.opp_id} to={`/opportunities/${opp.opp_id}`}>
                          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors">
                            <p className="font-medium text-sm text-slate-900 truncate">{opp.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-slate-500">{opp.engagement_type}</span>
                              <span className="font-medium text-amber-700 text-sm">
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
          </div>

          {/* Top Opportunities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6"
          >
            <Card className="border-slate-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Top Opportunities by Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topOpportunities.map((opp, index) => {
                    const stage = stages?.find(s => s.stage_id === opp.stage_id);
                    return (
                      <Link key={opp.opp_id} to={`/opportunities/${opp.opp_id}`}>
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-ocean-300 hover:shadow-soft transition-all">
                          <div className="w-8 h-8 bg-ocean-100 rounded-full flex items-center justify-center text-sm font-medium text-ocean-700">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{opp.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{opp.engagement_type}</Badge>
                              <span className="text-xs text-slate-500">{stage?.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-heading font-semibold text-ocean-950">
                              {formatCurrency(opp.estimated_value)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={opp.confidence_level} className="w-16 h-2" />
                              <span className="text-xs text-slate-500">{opp.confidence_level}%</span>
                            </div>
                          </div>
                        </div>
                      </Link>
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

export default ExecutiveDashboard;
