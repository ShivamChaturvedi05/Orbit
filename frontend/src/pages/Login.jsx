import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Sending a POST request directly to your API Gateway!
      const res = await api.post('/api/users/login', {
        email,
        password,
      });

      // Pass token, refreshToken, and userId
      login(res.data.token, res.data.refreshToken, res.data.userId);
      
      // Smart Redirection logic: Check if there is a 'redirect' in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/';
      navigate(redirectUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass-card p-10 max-w-md w-full">
        <h2 className="text-3xl font-bold mb-2 text-center tracking-tight">Sign in.</h2>
        <p className="text-gray-500 mb-8 text-center text-sm">Use your Orbit ID to shop securely.</p>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">
          Don't have an Orbit ID? <Link to="/register" className="text-apple-blue hover:underline">Create yours now.</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
