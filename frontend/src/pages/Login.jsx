import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Compass, TrendingUp, Users, Target, Sparkles, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Beach background image
const BEACH_BG = "https://images.unsplash.com/photo-1764616683064-2987484c488d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHx0cm9waWNhbCUyMGJlYWNoJTIwb2NlYW4lMjBzdW5zZXQlMjBjYWxtfGVufDB8fHx8MTc3MjY2MjIxMnww&ixlib=rb-4.1.0&q=85";

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Beach Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BEACH_BG})` }}
      />
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-ocean-900/60" />

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-ocean-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900/80 to-transparent" />
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-lg">
                <Compass className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Compass X</h1>
                <p className="text-ocean-300 text-sm font-medium -mt-1">Grow</p>
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean-300 to-amber-300">
                  clarity & confidence
                </span>
              </h2>
              <p className="text-white/70 text-lg max-w-md">
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
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full"
                >
                  <feature.icon className="w-4 h-4 text-ocean-300" />
                  <span className="text-sm text-white/90">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/50 text-sm"
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
              <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Compass X Grow</span>
            </div>

            {/* Glassmorphic Card */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-ocean-400/30 via-amber-400/20 to-ocean-400/30 rounded-3xl blur-xl opacity-70" />
              
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                  <p className="text-white/60 text-sm">Sign in to continue to your dashboard</p>
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
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-12 focus:border-ocean-400 focus:ring-ocean-400/30 transition-all backdrop-blur-sm"
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
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-12 pr-12 focus:border-ocean-400 focus:ring-ocean-400/30 transition-all backdrop-blur-sm"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    data-testid="login-submit-btn"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold rounded-xl shadow-lg shadow-ocean-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-ocean-500/40 hover:scale-[1.02] mt-2 border-0"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
