import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Compass, Users, Briefcase, BarChart3, Sparkles, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      toast.success(`Welcome back, ${data.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true, state: { user: data } });
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Briefcase, title: 'Pipeline-First', desc: 'Kanban-style deal management' },
    { icon: Users, title: 'Activity-Driven', desc: 'Never let deals go stale' },
    { icon: BarChart3, title: 'Executive Dashboards', desc: 'Clear visibility & forecasts' },
    { icon: Sparkles, title: 'AI Copilot', desc: 'Smart insights & suggestions' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ocean-950 to-ocean-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <Compass className="w-6 h-6 text-ocean-950" />
            </div>
            <span className="text-2xl font-heading font-semibold text-white">Compass X Grow</span>
          </div>
          <p className="text-ocean-200 text-lg">Sales Engagement CRM</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-8"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-semibold text-white leading-tight">
            Close more deals with<br />
            <span className="text-secondary">clarity & confidence</span>
          </h1>
          
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <feature.icon className="w-6 h-6 text-secondary mb-2" />
                <h3 className="font-medium text-white text-sm">{feature.title}</h3>
                <p className="text-ocean-300 text-xs mt-1">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-ocean-400 text-sm"
        >
          Built for Tech, Data & AI Consulting teams
        </motion.p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-ocean-950 rounded-full flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-heading font-semibold text-ocean-950">Compass X Grow</span>
          </div>

          <Card className="border-slate-200 shadow-soft">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-heading">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="you@compassx.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-xl"
                    autoComplete="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      data-testid="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="rounded-xl pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  data-testid="login-submit-btn"
                  disabled={isLoading}
                  className="w-full bg-ocean-950 hover:bg-ocean-900 text-white rounded-full py-6 font-medium transition-all hover:shadow-lg mt-6"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-500 mt-6">
            Contact your administrator for account access
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
