import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#023047', '#219EBC', '#8ECAE6', '#FFB703', '#FB8500', '#E63946', '#2A9D8F'];

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'ocean' }) => {
  const colorClasses = {
    ocean: 'bg-ocean-100 text-ocean-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600'
  };

  return (
    <Card className="border-slate-200 shadow-soft" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-heading font-semibold text-slate-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Reports = () => {
  const [pipelineData, setPipelineData] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pipelineRes, engagementRes, ownerRes, summaryRes] = await Promise.all([
        fetch(`${API}/analytics/pipeline`, { credentials: 'include' }),
        fetch(`${API}/analytics/engagement-types`, { credentials: 'include' }),
        fetch(`${API}/analytics/by-owner`, { credentials: 'include' }),
        fetch(`${API}/analytics/summary`, { credentials: 'include' })
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-80 bg-slate-200 rounded-xl"></div>
              <div className="h-80 bg-slate-200 rounded-xl"></div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-semibold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-500 mt-1">Pipeline and sales performance insights</p>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard 
              title="Total Pipeline" 
              value={formatCurrency(summary?.total_pipeline_value || 0)}
              subtitle={`${summary?.total_deals || 0} deals`}
              icon={DollarSign}
              color="ocean"
            />
            <MetricCard 
              title="Weighted Forecast" 
              value={formatCurrency(summary?.weighted_forecast || 0)}
              subtitle="Based on confidence"
              icon={Target}
              color="emerald"
            />
            <MetricCard 
              title="Win Rate" 
              value={`${summary?.win_rate || 0}%`}
              subtitle={`${summary?.won_deals || 0} won, ${summary?.lost_deals || 0} lost`}
              icon={TrendingUp}
              color="amber"
            />
            <MetricCard 
              title="At Risk" 
              value={summary?.at_risk_deals || 0}
              subtitle={`${summary?.overdue_activities || 0} overdue activities`}
              icon={AlertTriangle}
              color="rose"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pipeline by Stage */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Pipeline by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                      />
                      <YAxis 
                        dataKey="stage" 
                        type="category" 
                        width={150}
                        tick={{ fill: '#334155', fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name === 'value' ? 'Total Value' : 'Weighted']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#023047" 
                        radius={[0, 4, 4, 0]}
                        name="Pipeline Value"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline by Owner */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Pipeline by Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ownerData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                      />
                      <YAxis 
                        dataKey="owner_name" 
                        type="category" 
                        width={130}
                        tick={{ fill: '#334155', fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name === 'value' ? 'Total Value' : 'Weighted']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#219EBC" 
                        radius={[0, 4, 4, 0]}
                        name="Pipeline Value"
                      />
                      <Bar 
                        dataKey="weighted" 
                        fill="#8ECAE6" 
                        radius={[0, 4, 4, 0]}
                        name="Weighted Value"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Deals by Engagement Type */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Deals by Engagement Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="type"
                        label={({ type, percent }) => percent > 0.05 ? `${type} ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card className="border-slate-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-ocean-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-ocean-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Total Activities</p>
                        <p className="text-sm text-slate-500">All time</p>
                      </div>
                    </div>
                    <p className="text-2xl font-heading font-semibold text-slate-900">
                      {summary?.total_activities || 0}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Completed</p>
                        <p className="text-sm text-slate-500">Activities done</p>
                      </div>
                    </div>
                    <p className="text-2xl font-heading font-semibold text-emerald-600">
                      {summary?.completed_activities || 0}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Overdue</p>
                        <p className="text-sm text-slate-500">Needs attention</p>
                      </div>
                    </div>
                    <p className="text-2xl font-heading font-semibold text-rose-600">
                      {summary?.overdue_activities || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Owner Performance Table */}
          <Card className="border-slate-200 shadow-soft mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Performance by Sales Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="owner-performance-table">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Owner</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Deals</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Pipeline Value</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Weighted</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Won</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Lost</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No data available
                        </td>
                      </tr>
                    ) : (
                      ownerData.map((row, index) => (
                        <tr key={row.owner_id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              >
                                {row.owner_name?.charAt(0) || '?'}
                              </div>
                              <span className="font-medium text-slate-900">{row.owner_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.total}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">
                            {formatCurrency(row.value)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            {formatCurrency(row.weighted)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                              {row.won}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                              {row.lost}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-medium ${
                              row.win_rate >= 50 ? 'text-emerald-600' : 
                              row.win_rate >= 25 ? 'text-amber-600' : 'text-slate-600'
                            }`}>
                              {row.win_rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Types Table */}
          <Card className="border-slate-200 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Performance by Engagement Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="engagement-performance-table">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Deals</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Total Value</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Avg. Deal</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Won</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engagementData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No data available
                        </td>
                      </tr>
                    ) : (
                      engagementData.map((row, index) => (
                        <tr key={row.type} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="font-medium text-slate-900">{row.type}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.total}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">
                            {formatCurrency(row.value)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            {formatCurrency(row.total > 0 ? row.value / row.total : 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.won}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-medium ${
                              row.win_rate >= 50 ? 'text-emerald-600' : 
                              row.win_rate >= 25 ? 'text-amber-600' : 'text-slate-600'
                            }`}>
                              {row.win_rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Reports;
