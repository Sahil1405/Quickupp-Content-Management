import React, { useState } from 'react';
import { ActivityLog, User } from '../types';
import { Activity, Filter, Clock, Search } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  allUsers: User[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, allUsers }) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (search && !log.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Publishing Audit Trail &amp; Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable audit record of video creation, uploads, downloads, rescheduling, and live postings.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 overflow-x-auto text-xs">
        <div className="flex items-center gap-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATED">Created</option>
          <option value="VIDEO_UPLOADED">Video Uploaded</option>
          <option value="VIDEO_DOWNLOADED">Video Downloaded</option>
          <option value="STATUS_CHANGED">Status Changed</option>
          <option value="POSTED">Posted</option>
          <option value="ISSUE_REPORTED">Issue Reported</option>
          <option value="REVISION_REQUESTED">Revision Requested</option>
          <option value="DATE_CHANGED">Date Changed</option>
        </select>

        <div className="relative flex-1 min-w-[200px] ml-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Timeline List (Section 20 & 48) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
          {filteredLogs.map((log) => {
            const user = allUsers.find(u => u.id === log.user_id);
            const dateObj = new Date(log.created_at);

            return (
              <div key={log.id} className="relative group">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white" />

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {user?.name || log.user_name || 'System'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {dateObj.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-1 font-medium">
                    {log.description}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No activity logs match your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
