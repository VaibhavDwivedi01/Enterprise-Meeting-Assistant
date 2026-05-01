import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Presentation, Loader2, User, Users, Briefcase, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', teamCode: '', teamName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState('PERSONAL'); // 'PERSONAL', 'TEAM', 'MANAGER'
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await api.get('/auth/managers');
        setManagers(response.data);
      } catch (err) {
        console.error("Failed to fetch managers", err);
      }
    };
    fetchManagers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (accountType === 'TEAM' && !formData.teamCode) {
      setError('Please directly input the specific Team Code to join the hierarchy.');
      return;
    }

    setLoading(true);
    setError('');
    
    // Dynamically map visual account type to actual DB role logic safely
    let targetRole = 'ROLE_EMPLOYEE';
    let inputTeamCode = '';
    
    if (accountType === 'MANAGER') targetRole = 'ROLE_ADMIN';
    if (accountType === 'TEAM') inputTeamCode = formData.teamCode;

    const payload = {
      ...formData,
      role: targetRole,
      teamCode: inputTeamCode || null,
      teamName: accountType === 'MANAGER' ? formData.teamName : null
    };

    try {
      const response = await api.post('/auth/register', payload);
      login({ name: response.data.name, role: response.data.role, profilePic: response.data.profilePic, teamCode: response.data.teamCode, teamName: response.data.teamName }, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Ensure your email is fresh and your Team Code is perfectly correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[linear-gradient(rgba(249,250,251,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(249,250,251,.8)_1px,transparent_1px)] bg-[size:30px_30px] backdrop-blur-3xl relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="flex justify-center text-blue-600 drop-shadow-md">
          <Presentation className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900 tracking-tight">Select your path</h2>
        <p className="mt-2 text-center text-base text-gray-600">
          How do you intend to use the Enterprise Meeting Assistant?
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-4 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)] sm:rounded-3xl sm:px-10 border border-white">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm border border-red-100 flex items-center justify-center font-medium">{error}</div>}
            
            {/* Account Type Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
               <div onClick={() => setAccountType('PERSONAL')} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 ${accountType === 'PERSONAL' ? 'border-blue-500 bg-blue-50/50 shadow-md transform -translate-y-1' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                 <div className={`p-3 rounded-full ${accountType === 'PERSONAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}><User className="h-6 w-6" /></div>
                 <div><h4 className={`font-bold text-sm ${accountType === 'PERSONAL' ? 'text-blue-900' : 'text-gray-700'}`}>Personal</h4><p className="text-[10px] text-gray-500 mt-1 leading-tight">Private space. Unsupervised autonomous extraction.</p></div>
               </div>

               <div onClick={() => setAccountType('TEAM')} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 ${accountType === 'TEAM' ? 'border-indigo-500 bg-indigo-50/50 shadow-md transform -translate-y-1' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}>
                 <div className={`p-3 rounded-full ${accountType === 'TEAM' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'}`}><Users className="h-6 w-6" /></div>
                 <div><h4 className={`font-bold text-sm ${accountType === 'TEAM' ? 'text-indigo-900' : 'text-gray-700'}`}>Team Member</h4><p className="text-[10px] text-gray-500 mt-1 leading-tight">Join a team. Report to a structural Manager.</p></div>
               </div>

               <div onClick={() => setAccountType('MANAGER')} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 ${accountType === 'MANAGER' ? 'border-purple-500 bg-purple-50/50 shadow-md transform -translate-y-1' : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'}`}>
                 <div className={`p-3 rounded-full ${accountType === 'MANAGER' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-gray-100 text-gray-400'}`}><Briefcase className="h-6 w-6" /></div>
                 <div><h4 className={`font-bold text-sm ${accountType === 'MANAGER' ? 'text-purple-900' : 'text-gray-700'}`}>Team Manager</h4><p className="text-[10px] text-gray-500 mt-1 leading-tight">Supervise users. Extract team analytics.</p></div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {accountType === 'MANAGER' && (
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 shadow-inner">
                <label className="block text-sm font-bold text-purple-900 mb-2">Workspace & Team Name (Optional)</label>
                <input type="text" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} 
                  className="block w-full px-4 py-3 border border-purple-200 rounded-xl shadow-sm placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-purple-900" placeholder="e.g. Sales Department" />
              </div>
            )}

            {accountType === 'TEAM' && (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-inner relative">
                <label className="block text-sm font-bold text-indigo-900 mb-2">Enter Secure Team Code</label>
                <input type="text" required value={formData.teamCode} onChange={e => setFormData({...formData, teamCode: e.target.value.toUpperCase()})} 
                  className="block w-full px-4 py-3 border border-indigo-200 rounded-xl shadow-sm placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase font-mono font-bold tracking-widest text-indigo-900" placeholder="e.g. AB9X2Y" />
                <p className="text-[11px] text-indigo-600 mt-2 font-medium leading-tight">Your Admin must provide you with their 6-character Team Code. Your tasks will be securely routed directly to their dashboard.</p>
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none transition-all duration-300 transform hover:-translate-y-0.5">
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm & Create Free Account'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center text-sm">
             <span className="text-gray-500 font-medium">Already have an operational account? </span>
             <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 ml-1 hover:underline">Sign in securely</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
