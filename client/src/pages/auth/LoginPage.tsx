import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email: loginEmail, password: loginPassword });
      const { user, accessToken } = response.data.data;

      login(user, accessToken);

      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (user.role === 'DEALER') {
        navigate('/owner');
      } else if (user.role === 'CUSTOMER') {
        navigate('/buyer');
      } else {
        setError('Access denied. Unknown role.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f2557] py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm border-sky-200 dark:border-sky-800/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#0f2557] to-[#0ea5e9] rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <CardTitle className="text-2xl text-[#0f172a] dark:text-white">MAAPG</CardTitle>
          <CardDescription className="text-sky-600 dark:text-sky-400">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0f172a] dark:text-sky-100">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="border-sky-200 dark:border-sky-800/30 focus-visible:ring-sky-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0f172a] dark:text-sky-100">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="border-sky-200 dark:border-sky-800/30 focus-visible:ring-sky-500"
              />
            </div>
            <Button type="submit" className="w-full bg-[#0f2557] hover:bg-[#1a3a6b] dark:bg-sky-600 dark:hover:bg-sky-500 text-white" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Quick Login:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleLogin('admin@maapg.com', 'Admin@123')}
                className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-left hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-xs font-bold text-[#0f172a] dark:text-sky-200">SuperAdmin</p>
                <p className="text-xs text-gray-500 dark:text-sky-400 mt-0.5">admin@maapg.com</p>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleLogin('dealer@maapg.com', 'Dealer@123')}
                className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-left hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-xs font-bold text-green-800 dark:text-green-300">Owner/Dealer</p>
                <p className="text-xs text-gray-500 dark:text-green-400 mt-0.5">dealer@maapg.com</p>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleLogin('buyer@maapg.com', 'Buyer@123')}
                className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-left hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-xs font-bold text-purple-800 dark:text-purple-300">Buyer</p>
                <p className="text-xs text-gray-500 dark:text-purple-400 mt-0.5">buyer@maapg.com</p>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
