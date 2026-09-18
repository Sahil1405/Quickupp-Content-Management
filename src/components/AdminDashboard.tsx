import React, { useState } from 'react';
import { 
  ContentItem, 
  User, 
  OperationalMetrics, 
  ContentIssue 
} from '../types';
import { StatusBadge, OverdueBadge } from './StatusBadge';
import { PlatformBadge } from './PlatformBadge';
import { UserAvatar } from './UserAvatar';
import { 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw, 
  Film, 
  Calendar as CalendarIcon,
  ArrowRight,
  Send,
  Eye,
  Activity,
  Layers,
  FileEdit
} from 'lucide-react';

interface AdminDashboardProps {
  metrics: OperationalMetrics;
  contentList: ContentItem[];
  allUsers: User[];
  issues: ContentIssue[];
  onSelectContent: (content: ContentItem) => void;
  onOpenCreateModal: () => void;
  onNavigateToCalendar: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  metrics,
  contentList,
  allUsers,
  issues,
  onSelectContent,
  onOpenCreateModal,
  onNavigateToCalendar,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('TODAY');

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  // Overdue logic
  const isOverdueItem = (item: ContentItem) => {
    if (item.status === 'POSTED') return false;
    const isPastDate = item.scheduled_date < todayStr;
    const isTodayPastTime = item.scheduled_date === todayStr && item.scheduled_time < nowTime;
    return isPastDate || isTodayPastTime;
  };

  const todayItems = contentList.filter(c => c.scheduled_date === todayStr);
  const overdueItems = contentList.filter(isOverdueItem);
  const revisionItems = contentList.filter(c => c.status === 'REVISION');
  const openIssues = issues.filter(i => i.status === 'OPEN');

  // Deduplicate attention items so each unique content item appears only once
  const attentionItemsMap = new Map<string, ContentItem>();
  overdueItems.forEach(item => attentionItemsMap.set(item.id, item));
  revisionItems.forEach(item => attentionItemsMap.set(item.id, item));
  contentList.filter(c => c.status === 'ISSUE').forEach(item => attentionItemsMap.set(item.id, item));
  const attentionItems = Array.from(attentionItemsMap.values());

  const getFilteredItems = () => {
    switch (activeFilter) {
      case 'TODAY':
        return todayItems;
      case 'READY':
        return contentList.filter(c => c.status === 'READY_TO_POST');
      case 'OVERDUE':
        return overdueItems;
      case 'EDITING':
        return contentList.filter(c => c.status === 'EDITING');
      case 'POSTED':
        return contentList.filter(c => c.status === 'POSTED');
      case 'ISSUES':
        return contentList.filter(c => c.status === 'ISSUE');
      default:
        return contentList;
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      {/* Top Banner with Action */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Publishing Operations Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time pipeline tracking: editors, upload handoffs, and intern publishing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToCalendar}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <span>Open Calendar</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            id="btn-admin-create-content"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Content</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards (Section 17) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setActiveFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
            activeFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'
          }`}>
            Total Content
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 block">
            {metrics.total}
          </span>
        </div>

        <div
          onClick={() => setActiveFilter('EDITING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'EDITING'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
            activeFilter === 'EDITING' ? 'text-amber-100' : 'text-slate-400'
          }`}>
            Editing
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 block text-amber-600 group-hover:text-amber-700">
            {metrics.editing}
          </span>
        </div>

        <div
          onClick={() => setActiveFilter('READY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'READY'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
            activeFilter === 'READY' ? 'text-emerald-100' : 'text-slate-400'
          }`}>
            Ready to Post
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 block text-emerald-600">
            {metrics.ready_to_post}
          </span>
        </div>

        <div
          onClick={() => setActiveFilter('POSTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'POSTED'
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
            activeFilter === 'POSTED' ? 'text-blue-100' : 'text-slate-400'
          }`}>
            Posted
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 block text-blue-600">
            {metrics.posted}
          </span>
        </div>

        <div
          onClick={() => setActiveFilter('OVERDUE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'OVERDUE'
              ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
            activeFilter === 'OVERDUE' ? 'text-rose-100' : 'text-slate-400'
          }`}>
            Overdue
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 block text-rose-600">
            {metrics.overdue_posting + metrics.overdue_editing}
          </span>
        </div>

        <div
          onClick={() => setActiveFilter('ISSUES')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeFilter === 'ISSUES'
              ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
            activeFilter === 'ISSUES' ? 'text-rose-100' : 'text-slate-400'
          }`}>
            Issues
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 block text-rose-600">
            {openIssues.length}
          </span>
        </div>
      </div>

      {/* Attention Required Block (Section 17: Attention Required) */}
      {attentionItems.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-rose-950 text-sm">
                Attention Required ({attentionItems.length})
              </h3>
            </div>
            <span className="text-xs text-rose-700 font-medium">
              Action needed to maintain daily publishing schedule
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionItems.map((item) => {
              const editor = allUsers.find(u => u.id === item.editor_id);
              const poster = allUsers.find(u => u.id === item.poster_id);
              const isOverduePosting = item.status === 'READY_TO_POST' && isOverdueItem(item);
              const isOverdueEditing = (item.status === 'EDITING' || item.status === 'PLANNED') && isOverdueItem(item);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectContent(item)}
                  className="bg-white p-3.5 rounded-xl border border-rose-200/80 shadow-2xs hover:border-rose-400 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xs font-bold text-slate-500">
                        {item.scheduled_date} · {item.scheduled_time}
                      </span>
                      {isOverduePosting && <OverdueBadge type="posting" />}
                      {isOverdueEditing && <OverdueBadge type="editing" />}
                      {item.status === 'REVISION' && (
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                          Revision
                        </span>
                      )}
                      {item.status === 'ISSUE' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                          Issue
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                      {item.title}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <span>Editor: <strong className="text-slate-700">{editor?.name}</strong></span>
                    <span>Poster: <strong className="text-slate-700">{poster?.name}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Feed with Quick Filters (Section 24) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">
              {activeFilter === 'TODAY' ? "Today's Content (Sept 17, 2026)" : `${activeFilter} Queue`}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {filteredItems.length} videos
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'TODAY', label: "Today's Content" },
              { id: 'READY', label: 'Ready to Post' },
              { id: 'EDITING', label: 'Editing' },
              { id: 'POSTED', label: 'Posted' },
              { id: 'OVERDUE', label: 'Overdue' },
              { id: 'ALL', label: 'All Content' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table / Cards */}
        <div className="divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const editor = allUsers.find(u => u.id === item.editor_id);
            const poster = allUsers.find(u => u.id === item.poster_id);

            return (
              <div
                key={item.id}
                onClick={() => onSelectContent(item)}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-3 rounded-xl cursor-pointer transition-all group"
              >
                {/* Time & Title */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 text-center shrink-0">
                    <span className="block text-xs font-bold text-slate-900">
                      {item.scheduled_time}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {item.scheduled_date}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={item.platform} />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>
                        Editor: <strong className="text-slate-800 font-semibold">{editor?.name || 'Unassigned'}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Poster: <strong className="text-slate-800 font-semibold">{poster?.name || 'Unassigned'}</strong>
                      </span>
                      {item.post_url && (
                        <>
                          <span>·</span>
                          <span className="text-blue-600 font-medium truncate max-w-[200px]">
                            {item.post_url}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & CTA */}
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={item.status} size="sm" />
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No content items matching this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
