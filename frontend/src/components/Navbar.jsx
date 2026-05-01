import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Bell, Check, Loader2 } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      try {
        await api.post('/users/profile-pic', { profilePic: base64String });
        updateProfile(base64String);
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 w-full transition-all">
      <div className="flex-1">
        <h1 className="text-xl font-medium text-gray-800">Welcome back, <span className="font-semibold">{user?.name || 'User'}</span> 👋</h1>
      </div>
      <div className="flex items-center gap-6 relative">
        <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>

        {showDropdown && (
          <div className="absolute top-12 right-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 font-semibold text-gray-800 flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} new</span>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? <div className="p-4 text-sm text-gray-400 text-center">No notifications yet</div> : notifications.map(notif => (
                <div key={notif.id} onClick={() => !notif.isRead && markAsRead(notif.id)} className={`p-4 border-b border-gray-50 text-sm cursor-pointer transition-colors ${notif.isRead ? 'bg-white opacity-60' : 'bg-blue-50/20 hover:bg-blue-50/50'}`}>
                  <p className={`${notif.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
          {user?.role === 'ROLE_ADMIN' && user?.teamCode && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm">
               <span className="text-[10px] sm:text-xs font-bold text-indigo-800 tracking-wider hidden sm:block uppercase">{user?.teamName || 'YOUR TEAM'} CODE:</span>
               <span className="text-[10px] sm:text-xs font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-inner border border-indigo-50 select-all cursor-copy">{user.teamCode}</span>
            </div>
          )}
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mt-0.5">{user?.role?.replace('ROLE_', '')}</p>
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          
          <div onClick={() => fileInputRef.current.click()} className="relative h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:ring-4 ring-blue-100 transition-all overflow-hidden group border border-blue-200">
            {uploading ? <Loader2 className="animate-spin h-5 w-5" /> : (
               user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" alt="Profile" /> : <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-medium text-white tracking-widest uppercase">Edit</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default Navbar;
