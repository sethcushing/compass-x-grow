import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, Users, Briefcase, BarChart3, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleDemoLogin = async (type) => {
    setDemoLoading(type);
    try {
      const response = await fetch(`${API}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
      });

      if (!response.ok) throw new Error('Demo login failed');

      const user = await response.json();
      
      // Seed data for demo
      await fetch(`${API}/seed`, {
        method: 'POST',
        credentials: 'include'
      });

      navigate('/dashboard', { replace: true, state: { user } });
    } catch (error) {
      console.error('Demo login error:', error);
      setDemoLoading(null);
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
            <span className="text-2xl font-heading font-semibold text-white">CompassX</span>
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

      {/* Right Panel - Login */}
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
            <span className="text-2xl font-heading font-semibold text-ocean-950">CompassX</span>
          </div>

          <Card className="border-slate-200 shadow-soft">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-heading">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                data-testid="google-login-btn"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-ocean-950 hover:bg-ocean-900 text-white rounded-full py-6 font-medium transition-all hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-500">Or try demo accounts</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  data-testid="demo-sales-btn"
                  variant="outline"
                  onClick={() => handleDemoLogin('sales_lead')}
                  disabled={demoLoading !== null}
                  className="w-full rounded-full py-5 border-slate-200 hover:bg-slate-50 hover:border-ocean-300"
                >
                  {demoLoading === 'sales_lead' ? (
                    <div className="w-4 h-4 border-2 border-ocean-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2 text-ocean-600" />
                      Sales Lead Demo
                    </>
                  )}
                </Button>

                <Button
                  data-testid="demo-executive-btn"
                  variant="outline"
                  onClick={() => handleDemoLogin('executive')}
                  disabled={demoLoading !== null}
                  className="w-full rounded-full py-5 border-slate-200 hover:bg-slate-50 hover:border-ocean-300"
                >
                  {demoLoading === 'executive' ? (
                    <div className="w-4 h-4 border-2 border-ocean-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2 text-ocean-600" />
                      Executive Demo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-500 mt-6">
            Purpose-built for consulting sales teams
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
