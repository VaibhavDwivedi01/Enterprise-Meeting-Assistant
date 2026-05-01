import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, Clock, ListTodo, TrendingUp, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Track team productivity and meeting outcomes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tasks" value={stats?.totalTasks || 0} icon={<ListTodo className="h-6 w-6 text-blue-600" />} bg="bg-blue-50" />
        <StatCard title="Completed" value={stats?.completedTasks || 0} icon={<CheckCircle className="h-6 w-6 text-green-600" />} bg="bg-green-50" />
        <StatCard title="Pending" value={stats?.pendingTasks || 0} icon={<Clock className="h-6 w-6 text-orange-600" />} bg="bg-orange-50" />
        <StatCard title="Productivity Rate" value={stats?.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) + '%' : '0%'} icon={<TrendingUp className="h-6 w-6 text-purple-600" />} bg="bg-purple-50" />
      </div>
      
      <div className="mt-10 bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-white">
         <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500"/> Team Activity Analytics</h2>
         <div className="h-80 w-full bg-white/50 p-4 rounded-2xl border border-gray-100 shadow-sm">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart
               data={[
                 {
                   name: 'Task Breakdown',
                   Pending: stats?.pendingTasks || 0,
                   'In Progress': (stats?.totalTasks || 0) - (stats?.pendingTasks || 0) - (stats?.completedTasks || 0),
                   Completed: stats?.completedTasks || 0,
                 }
               ]}
               margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
             >
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} />
               <YAxis axisLine={false} tickLine={false} />
               <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
               <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
               <Bar dataKey="Pending" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={60} />
               <Bar dataKey="In Progress" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={60} />
               <Bar dataKey="Completed" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={60} />
             </BarChart>
           </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg }) => (
  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex items-center gap-5 transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] duration-500 group relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className={`p-4 rounded-2xl ${bg} transform group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
      {icon}
    </div>
    <div className="z-10">
      <p className="text-sm font-semibold text-gray-500 tracking-wide uppercase">{title}</p>
      <h3 className="text-3xl font-black text-gray-800 mt-1 tracking-tight">{value}</h3>
    </div>
  </div>
);

export default Dashboard;
