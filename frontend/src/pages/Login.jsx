import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Compass, TrendingUp, Users, Target, Sparkles, Eye, EyeOff } from 'lucide-react';
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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server error. Please try again later.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      const firstName = data.name ? data.name.split(' ')[0] : 'there';
      toast.success(`Welcome back, ${firstName}!`);
      navigate('/dashboard', { replace: true, state: { user: data } });
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, label: 'Pipeline Management' },
    { icon: Users, label: 'Client Tracking' },
    { icon: Target, label: 'Deal Analytics' },
    { icon: Sparkles, label: 'AI Insights' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-ocean-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ocean-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-ocean-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/25">
                <Compass className="w-7 h-7 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Compass X</h1>
                <p className="text-ocean-300 text-sm font-medium">Grow</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-5xl font-bold text-white leading-tight mb-4">
                Close deals with
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-300">
                  clarity & confidence
                </span>
              </h2>
              <p className="text-ocean-200 text-lg max-w-md">
                The modern CRM built for consulting teams who value pipeline visibility and activity-driven selling.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full"
                >
                  <feature.icon className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-white/80">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-ocean-400 text-sm"
          >
            Built for Tech, Data & AI Consulting teams
          </motion.p>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-yellow-400 rounded-xl flex items-center justify-center">
                <Compass className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-xl font-bold text-white">Compass X Grow</span>
            </div>

            {/* Glassmorphic Card */}
            <div className="relative">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary/20 via-ocean-400/20 to-secondary/20 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                  <p className="text-ocean-200 text-sm">Sign in to continue to your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80 text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      data-testid="login-email-input"
                      type="email"
                      placeholder="you@compassx.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-12 focus:border-secondary/50 focus:ring-secondary/20 transition-all"
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/80 text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        data-testid="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-12 pr-12 focus:border-secondary/50 focus:ring-secondary/20 transition-all"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    data-testid="login-submit-btn"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-secondary to-yellow-400 hover:from-secondary/90 hover:to-yellow-400/90 text-slate-900 font-semibold rounded-xl shadow-lg shadow-secondary/25 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/30 hover:scale-[1.02] mt-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <p className="text-center text-white/40 text-xs mt-6">
                  Contact your administrator for account access
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
