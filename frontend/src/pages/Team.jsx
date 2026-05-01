import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, User, Clock, Mail } from 'lucide-react';

const Team = () => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await api.get('/users/team');
      setTeam(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Workspace Directory</h1>
        <p className="mt-1 text-sm text-gray-500">Manage all registered employees structurally deployed beneath your account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {team && team.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center">
             <div className="p-5 bg-gray-50 rounded-full mb-4 shadow-inner">
               <User className="h-10 w-10 opacity-40 text-gray-800" />
             </div>
             <p className="text-xl font-bold text-gray-600 mb-1">Your Team is currently empty.</p>
             <p className="text-sm font-medium leading-relaxed">Provide your unique <span className="font-bold text-indigo-500">Team Code</span> (found in the top navigation bar) to your employees.<br/>They must enter it during registration to appear here!</p>
          </div>
        ) : team && team.map(member => (
           <div key={member.id} className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center text-white mb-4 relative group-hover:scale-105 transition-transform">
                 {member.profilePic ? <img src={member.profilePic} alt={member.name} className="w-full h-full object-cover" /> : <span className="text-3xl font-bold tracking-tight">{member.name.charAt(0).toUpperCase()}</span>}
              </div>
              <h3 className="text-lg font-bold text-gray-800 tracking-tight">{member.name}</h3>
              <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg mt-2 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</p>
              
              <div className="mt-5 pt-4 border-t border-gray-50 w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                 <Clock className="h-3.5 w-3.5" /> Hooked: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};
export default Team;
