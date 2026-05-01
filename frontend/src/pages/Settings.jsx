import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, KeyRound, ShieldAlert, RefreshCw, Loader2, X } from 'lucide-react';

const Settings = () => {
  const { user, updateTeamCode } = useContext(AuthContext);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loadingPass, setLoadingPass] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });
  
  const [teamCode, setTeamCode] = useState(user?.teamCode || '');
  const [loadingCode, setLoadingCode] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setLoadingPass(true);
    try {
      await api.put('/users/password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassMessage({ type: 'success', text: 'Password updated successfully!' });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
    } finally {
      setLoadingPass(false);
    }
  };

  const triggerReset = () => setConfirmModal({ isOpen: true });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false });

  const executeResetTeamCode = async () => {
    closeConfirmModal();
    setLoadingCode(true);
    try {
      const { data } = await api.put('/users/team-code');
      setTeamCode(data.teamCode);
      updateTeamCode(data.teamCode);
      toast.success("Team code reset successfully!");
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingCode(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="p-2.5 bg-gray-100 rounded-xl"><SettingsIcon className="h-6 w-6 text-gray-700" /></div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your security and account preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security / Password */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-6">
             <KeyRound className="h-5 w-5 text-blue-600"/> Change Password
          </h3>
          
          {passMessage.text && (
            <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${passMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {passMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
              <input type="password" required value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <input type="password" required value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" required value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <button type="submit" disabled={loadingPass} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
              {loadingPass ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Manager Settings */}
        {user?.role === 'ROLE_ADMIN' && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2 mb-2">
               <ShieldAlert className="h-5 w-5 text-indigo-600"/> Team Access Code
            </h3>
            <p className="text-sm text-indigo-700/80 mb-6">This is the code your employees use to join your team during registration.</p>
            
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-white/60 p-6 rounded-2xl border border-white">
               <div className="text-center">
                 <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Current Code</p>
                 <p className="text-4xl font-black text-indigo-600 tracking-widest">{teamCode}</p>
               </div>
               
               <button onClick={triggerReset} disabled={loadingCode} className="px-6 py-2.5 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 rounded-xl font-bold transition-all flex items-center gap-2 text-sm">
                 {loadingCode ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
                 Regenerate Code
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Regenerate Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-red-500" /> Are you sure?
              </h3>
              <button onClick={closeConfirmModal} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><X className="h-5 w-5"/></button>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              This will instantly invalidate your old Team Access Code. Existing employees on your team will <strong>not</strong> be disconnected, but any new employees signing up will be required to use the new code.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeConfirmModal} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={executeResetTeamCode} className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all">Yes, Regenerate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
