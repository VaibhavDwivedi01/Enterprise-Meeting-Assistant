import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, CheckSquare, Presentation, LogOut, Users, Settings as SettingsIcon } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="w-64 bg-white/70 backdrop-blur-xl shadow-[5px_0_30px_-10px_rgba(0,0,0,0.05)] border-r border-white/50 h-screen sticky top-0 flex flex-col justify-between z-20 transition-all">
      <div>
        <div className="h-20 flex items-center px-8 border-b border-gray-50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
            <Presentation className="h-6 w-6 text-blue-600" /> MeetAssist
          </h2>
        </div>
        <nav className="mt-8 flex flex-col gap-2 px-4">
          <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </NavLink>
          <NavLink to="/meetings" className={({isActive}) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>
            <Presentation className="h-5 w-5" /> Meetings
          </NavLink>
          <NavLink to="/tasks" className={({isActive}) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>
            <CheckSquare className="h-5 w-5" /> Tasks
          </NavLink>
          {user?.role === 'ROLE_ADMIN' && (
            <NavLink to="/team" className={({isActive}) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>
              <Users className="h-5 w-5" /> Team Directory
            </NavLink>
          )}
          <NavLink to="/settings" className={({isActive}) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>
            <SettingsIcon className="h-5 w-5" /> Settings
          </NavLink>
        </nav>
      </div>
      <div className="p-4 mb-4">
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50 p-3.5 font-medium rounded-xl transition-all duration-300">
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
