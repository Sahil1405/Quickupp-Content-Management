import React, { useState } from 'react';
import { User, UserRole, ContentItem } from '../types';
import { UserAvatar } from './UserAvatar';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Film, 
  Send, 
  CheckCircle2, 
  X,
  Mail,
  UserCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface TeamManagementProps {
  users: User[];
  contentList: ContentItem[];
  currentUser: User;
  onAddUser: (user: Partial<User>) => Promise<void>;
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  users,
  contentList,
  currentUser,
  onAddUser,
  onUpdateUser,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        status: 'active',
      });
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserWorkload = (userId: string, role: UserRole) => {
    if (role === 'editor') {
      const assigned = contentList.filter(c => c.editor_id === userId);
      const editing = assigned.filter(c => c.status === 'EDITING' || c.status === 'REVISION').length;
      const ready = assigned.filter(c => c.status === 'READY_TO_POST').length;
      const posted = assigned.filter(c => c.status === 'POSTED').length;
      return { total: assigned.length, active: editing, ready, posted };
    } else if (role === 'poster') {
      const assigned = contentList.filter(c => c.poster_id === userId);
      const ready = assigned.filter(c => c.status === 'READY_TO_POST').length;
      const posted = assigned.filter(c => c.status === 'POSTED').length;
      return { total: assigned.length, active: ready, ready, posted };
    }
    return { total: contentList.length, active: 0, ready: 0, posted: 0 };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Team Operations &amp; Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage video editors and posting interns, track workload distribution and publishing throughput.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Team Member</span>
          </button>
        )}
      </div>

      {/* Workload Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((user) => {
          const stats = getUserWorkload(user.id, user.role);

          const roleColors = {
            admin: 'bg-purple-50 text-purple-700 border-purple-200',
            editor: 'bg-blue-50 text-blue-700 border-blue-200',
            poster: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          }[user.role];

          return (
            <div
              key={user.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <UserAvatar user={user} size="md" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                    <span className="text-[11px] text-slate-400 block">{user.email}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleColors}`}
                >
                  {user.role}
                </span>
              </div>

              {/* Workload Stats */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 text-center gap-1">
                <div>
                  <span className="block font-bold text-slate-800 text-sm">{stats.total}</span>
                  <span className="text-[10px] text-slate-400">Total</span>
                </div>
                <div>
                  <span className="block font-bold text-amber-600 text-sm">{stats.active}</span>
                  <span className="text-[10px] text-slate-400">In Progress</span>
                </div>
                <div>
                  <span className="block font-bold text-emerald-600 text-sm">{stats.posted}</span>
                  <span className="text-[10px] text-slate-400">Published</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px]">Active status</span>
                </span>

                {currentUser.role === 'admin' && user.id !== currentUser.id && (
                  <button
                    onClick={() => {
                      const newRole: UserRole =
                        user.role === 'editor' ? 'poster' : user.role === 'poster' ? 'admin' : 'editor';
                      onUpdateUser(user.id, { role: newRole });
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Change Role
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Team Member</h3>
                  <p className="text-xs text-slate-500">Invite a new editor or posting intern</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="maya@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operational Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none"
                >
                  <option value="editor">Video Editor (Cut raw footage, upload final video)</option>
                  <option value="poster">Posting Intern (Download, copy caption, publish to platform)</option>
                  <option value="admin">Administrator / Manager (Full access &amp; scheduling)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
