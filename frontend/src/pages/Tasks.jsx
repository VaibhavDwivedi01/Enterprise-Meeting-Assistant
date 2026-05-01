import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Loader2, CheckSquare, Clock, CheckCircle, Calendar, Trash2, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('my_tasks'); // 'my_tasks' | 'delegated'
  const [delegateModal, setDelegateModal] = useState({ isOpen: false, task: null, email: '' });
  const [deadlineModal, setDeadlineModal] = useState({ isOpen: false, task: null, deadline: '' });
  const [addTaskModal, setAddTaskModal] = useState({ isOpen: false, title: '', deadline: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null });
  const { user } = useContext(AuthContext);

  const closeAddTaskModal = () => setAddTaskModal({ isOpen: false, title: '', deadline: '' });

  const handleCreateManualTask = async () => {
    if (!addTaskModal.title) {
       toast.error('Task title is required');
       return;
    }
    try {
      await api.post('/tasks/manual', { title: addTaskModal.title, deadline: addTaskModal.deadline });
      toast.success('Task created successfully!');
      fetchTasks();
      closeAddTaskModal();
    } catch (err) {
      toast.error('Failed to create task');
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [viewMode, user]);

  const fetchTasks = async () => {
    try {
       let endpoint = user?.role === 'ROLE_ADMIN' ? '/tasks/team' : '/tasks';
       if (viewMode === 'delegated') {
           endpoint = '/tasks/delegated';
       }
       const { data } = await api.get(endpoint);
       setTasks(data);
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/tasks/${id}/status`, { status: newStatus });
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const openDeleteModal = (id) => setDeleteModal({ isOpen: true, taskId: id });
  const closeDeleteModal = () => setDeleteModal({ isOpen: false, taskId: null });

  const confirmDelete = async () => {
    const { taskId } = deleteModal;
    if (!taskId) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete task');
    } finally {
      closeDeleteModal();
    }
  };

  const openDelegateModal = (task) => setDelegateModal({ isOpen: true, task, email: '' });
  const closeDelegateModal = () => setDelegateModal({ isOpen: false, task: null, email: '' });

  const confirmDelegate = async () => {
    const { task, email } = delegateModal;
    if (!email) return;
    try {
      await api.put(`/tasks/${task.id}/delegate?toEmail=${encodeURIComponent(email)}`);
      if (viewMode === 'my_tasks') setTasks(tasks.filter(t => t.id !== task.id));
      else fetchTasks();
      closeDelegateModal();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delegate task. Ensure the email is correct and exists.');
    }
  };

  const openDeadlineModal = (task) => setDeadlineModal({ isOpen: true, task, deadline: task.deadline || '' });
  const closeDeadlineModal = () => setDeadlineModal({ isOpen: false, task: null, deadline: '' });

  const confirmDeadline = async () => {
    const { task, deadline } = deadlineModal;
    if (!deadline) return;
    try {
      await api.put(`/tasks/${task.id}/deadline`, { deadline });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, deadline } : t));
      closeDeadlineModal();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update deadline');
    }
  };

  const downloadICS = (task) => {
    const now = new Date();
    const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let eventDate = now;
    if (task.deadline) {
       eventDate = new Date(task.deadline);
       if(isNaN(eventDate.getTime())) eventDate = new Date();
    }
    const dtStart = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Meeting Assistant//EN
BEGIN:VEVENT
UID:${task.id}-${dtStamp}@meetingassistant.com
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
SUMMARY:${task.title}
DESCRIPTION:Assigned to: ${task.assignedToName}\\nMeeting: ${task.meetingTitle || 'Automated Node'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${task.title.replace(/\s+/g, '_')}_Task.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateStatus(parseInt(taskId, 10), newStatus);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
          <p className="mt-1 text-sm text-gray-500">Manage tasks auto-extracted from your meetings or manually created.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAddTaskModal({ isOpen: true, title: '', deadline: '' })} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
            + Create Task
          </button>
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button onClick={() => setViewMode('my_tasks')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'my_tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>My Tasks</button>
             <button onClick={() => setViewMode('delegated')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'delegated' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Delegated by Me</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div 
          className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 shadow-sm transition-colors hover:bg-gray-100/50"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'PENDING')}
        >
           <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4 bg-orange-100 text-orange-700 w-fit px-3 py-1.5 rounded-full text-sm">
             <Clock className="h-4 w-4"/> Pending 
             <span className="ml-1 bg-white px-2 py-0.5 rounded-full text-xs font-bold">{tasks.filter(t => t.status === 'PENDING').length}</span>
           </h3>
           <div className="space-y-4">
              {tasks.filter(t => t.status === 'PENDING').map(task => (
               <TaskCard key={task.id} task={task} onUpdate={updateStatus} onDownloadICS={downloadICS} onDragStart={handleDragStart} onDelete={openDeleteModal} onDelegate={openDelegateModal} onUpdateDeadline={openDeadlineModal} viewMode={viewMode} />
             ))}
             {tasks.filter(t => t.status === 'PENDING').length === 0 && <p className="text-sm text-gray-400 text-center py-4">No pending tasks</p>}
           </div>
        </div>

        {/* In Progress Column */}
        <div 
          className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 shadow-sm transition-colors hover:bg-gray-100/50"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
        >
           <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4 bg-blue-100 text-blue-700 w-fit px-3 py-1.5 rounded-full text-sm">
             <Loader2 className="h-4 w-4"/> In Progress
             <span className="ml-1 bg-white px-2 py-0.5 rounded-full text-xs font-bold">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</span>
           </h3>
           <div className="space-y-4">
              {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
               <TaskCard key={task.id} task={task} onUpdate={updateStatus} onDownloadICS={downloadICS} onDragStart={handleDragStart} onDelete={openDeleteModal} onDelegate={openDelegateModal} onUpdateDeadline={openDeadlineModal} viewMode={viewMode} />
             ))}
             {tasks.filter(t => t.status === 'IN_PROGRESS').length === 0 && <p className="text-sm text-gray-400 text-center py-4">No tasks in progress</p>}
           </div>
        </div>

        {/* Completed Column */}
        <div 
          className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 shadow-sm transition-colors hover:bg-gray-100/50"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'COMPLETED')}
        >
           <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4 bg-green-100 text-green-700 w-fit px-3 py-1.5 rounded-full text-sm">
             <CheckCircle className="h-4 w-4"/> Completed
             <span className="ml-1 bg-white px-2 py-0.5 rounded-full text-xs font-bold">{tasks.filter(t => t.status === 'COMPLETED').length}</span>
           </h3>
           <div className="space-y-4">
              {tasks.filter(t => t.status === 'COMPLETED').map(task => (
               <TaskCard key={task.id} task={task} onUpdate={updateStatus} onDownloadICS={downloadICS} onDragStart={handleDragStart} onDelete={openDeleteModal} onDelegate={openDelegateModal} onUpdateDeadline={openDeadlineModal} viewMode={viewMode} />
             ))}
             {tasks.filter(t => t.status === 'COMPLETED').length === 0 && <p className="text-sm text-gray-400 text-center py-4">No completed tasks</p>}
           </div>
        </div>
      </div>

      {delegateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delegate Task</h3>
              <button onClick={closeDelegateModal} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><X className="h-5 w-5"/></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Enter the email address of the team member you want to delegate "{delegateModal.task?.title}" to.</p>
            <input 
              type="email" 
              value={delegateModal.email} 
              onChange={e => setDelegateModal({...delegateModal, email: e.target.value})} 
              placeholder="e.g. member@company.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all mb-6"
            />
            <div className="flex justify-end gap-3">
              <button onClick={closeDelegateModal} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={confirmDelegate} className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">Delegate</button>
            </div>
          </div>
        </div>
      )}

      {deadlineModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Deadline</h3>
              <button onClick={closeDeadlineModal} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><X className="h-5 w-5"/></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Set a new deadline for "{deadlineModal.task?.title}".</p>
            <input 
              type="text" 
              value={deadlineModal.deadline} 
              onChange={e => setDeadlineModal({...deadlineModal, deadline: e.target.value})} 
              placeholder="e.g. Next Friday, Oct 15"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all mb-6"
            />
            <div className="flex justify-end gap-3">
              <button onClick={closeDeadlineModal} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={confirmDeadline} className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">Save Deadline</button>
            </div>
          </div>
        </div>
      )}

      {addTaskModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create Task</h3>
              <button onClick={closeAddTaskModal} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><X className="h-5 w-5"/></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Manually create a new task. It will be assigned to you by default.</p>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={addTaskModal.title} 
              onChange={e => setAddTaskModal({...addTaskModal, title: e.target.value})} 
              placeholder="e.g. Prepare Q3 presentation"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all mb-4"
            />
            
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Optional)</label>
            <input 
              type="text" 
              value={addTaskModal.deadline} 
              onChange={e => setAddTaskModal({...addTaskModal, deadline: e.target.value})} 
              placeholder="e.g. Next Friday"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all mb-6"
            />
            
            <div className="flex justify-end gap-3">
              <button onClick={closeAddTaskModal} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleCreateManualTask} className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">Create Task</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                 <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Task</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeDeleteModal} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all">Delete Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskCard = ({ task, onUpdate, onDownloadICS, onDragStart, onDelete, onDelegate, onUpdateDeadline, viewMode }) => (
  <div 
    draggable={viewMode === 'my_tasks'}
    onDragStart={(e) => viewMode === 'my_tasks' ? onDragStart(e, task.id) : null}
    className={`bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-white hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 ${viewMode === 'my_tasks' ? 'cursor-grab active:cursor-grabbing border-l-[3px] border-l-blue-500 hover:border-l-indigo-500' : 'cursor-default border-l-[3px] border-l-purple-400'} group relative overflow-hidden`}
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-bl-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <h4 className="font-bold text-gray-800 leading-tight tracking-tight">{task.title}</h4>
    <p className="text-[11px] font-semibold text-gray-500 mt-1.5 mb-3 bg-gray-100/80 inline-block px-2.5 py-1 rounded-md truncate max-w-full">Meeting: {task.meetingTitle || 'Automated Node'}</p>
    
    {viewMode === 'delegated' && task.assignedToName && (
        <p className="text-xs text-indigo-600 font-medium mb-2">Delegated to: {task.assignedToName}</p>
    )}
    {viewMode === 'my_tasks' && task.delegatedByName && (
        <p className="text-xs text-orange-600 font-medium mb-2">Delegated by: {task.delegatedByName}</p>
    )}
    
    <div className="flex justify-between items-center text-sm">
      <span className="font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs">{task.assignedToName}</span>
      <div className="flex items-center gap-3">
         <span onClick={() => onUpdateDeadline(task)} className="text-gray-500 font-semibold text-[13px] flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors" title="Edit Deadline"><Clock className="h-4 w-4" /> {task.deadline || 'No deadline'}</span>
         {viewMode === 'my_tasks' && (
           <button onClick={() => onDelegate(task)} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Delegate Task">
              <Send className="h-5 w-5" />
           </button>
         )}
         <button onClick={() => onDownloadICS(task)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Add to Calendar">
            <Calendar className="h-5 w-5" />
         </button>
         <button onClick={() => onDelete(task.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete Task">
            <Trash2 className="h-5 w-5" />
         </button>
      </div>
    </div>

    <div className="mt-4 pt-3 border-t border-gray-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {task.status !== 'PENDING' && (
        <button onClick={() => onUpdate(task.id, 'PENDING')} className="text-xs font-semibold text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 transition-colors flex-1">Reset</button>
      )}
      {task.status !== 'IN_PROGRESS' && (
        <button onClick={() => onUpdate(task.id, 'IN_PROGRESS')} className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex-1">Start</button>
      )}
      {task.status !== 'COMPLETED' && (
        <button onClick={() => onUpdate(task.id, 'COMPLETED')} className="text-xs font-semibold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 transition-colors flex-1">Done</button>
      )}
    </div>
  </div>
);

export default Tasks;
