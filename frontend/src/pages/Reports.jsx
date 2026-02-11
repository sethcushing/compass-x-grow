import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#023047', '#219EBC', '#8ECAE6', '#FFB703', '#FB8500'];

const Reports = () => {
  const [pipelineData, setPipelineData] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pipelineRes, engagementRes] = await Promise.all([
        fetch(`${API}/analytics/pipeline`, { credentials: 'include' }),
        fetch(`${API}/analytics/engagement-types`, { credentials: 'include' })
      ]);
      
      const pipeline = await pipelineRes.json();
      const engagement = await engagementRes.json();
      
      setPipelineData(pipeline);
      setEngagementData(engagement);
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

  const totalPipelineValue = pipelineData.reduce((sum, s) => sum + (s.value || 0), 0);
  const totalWeighted = pipelineData.reduce((sum, s) => sum + (s.weighted || 0), 0);
  const totalDeals = pipelineData.reduce((sum, s) => sum + (s.count || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-slate-200 shadow-soft">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">Total Pipeline Value</p>
                <p className="text-3xl font-heading font-semibold text-slate-900 mt-1">
                  {formatCurrency(totalPipelineValue)}
                </p>
                <p className="text-xs text-slate-400 mt-2">{totalDeals} active deals</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-soft">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">Weighted Forecast</p>
                <p className="text-3xl font-heading font-semibold text-ocean-600 mt-1">
                  {formatCurrency(totalWeighted)}
                </p>
                <p className="text-xs text-slate-400 mt-2">Based on confidence levels</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-soft">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">Average Deal Size</p>
                <p className="text-3xl font-heading font-semibold text-slate-900 mt-1">
                  {formatCurrency(totalDeals > 0 ? totalPipelineValue / totalDeals : 0)}
                </p>
                <p className="text-xs text-slate-400 mt-2">Across all stages</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        tick={{ fill: '#334155', fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
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
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
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
          </div>

          {/* Engagement Types Table */}
          <Card className="border-slate-200 shadow-soft mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Performance by Engagement Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
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
                    {engagementData.map((row, index) => (
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
                    ))}
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
