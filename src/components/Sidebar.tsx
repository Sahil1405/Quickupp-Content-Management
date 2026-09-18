import React from 'react';
import { UserRole, OperationalMetrics } from '../types';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Film, 
  Users, 
  Activity, 
  Settings, 
  Clock, 
  Send,
  AlertTriangle
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'calendar'
  | 'content'
  | 'my_work'
  | 'posting_queue'
  | 'team'
  | 'activity'
  | 'settings';

interface SidebarProps {
  currentRole: UserRole;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  metrics?: OperationalMetrics;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  currentTab,
  onSelectTab,
  metrics,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const getNavItems = () => {
    if (currentRole === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'content', label: 'Content', icon: Film, badge: metrics?.total },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    } else if (currentRole === 'editor') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'my_work', label: 'My Work', icon: Clock, badge: metrics?.editing },
        { id: 'activity', label: 'Activity', icon: Activity },
      ];
    } else {
      // Poster
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'posting_queue', label: 'Posting Queue', icon: Send, badge: metrics?.ready_to_post },
        { id: 'activity', label: 'Activity', icon: Activity },
      ];
    }
  };

  const navItems = getNavItems();

  const content = (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-60 py-4 select-none">
      <div className="px-5 mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id as NavTab);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Operational Summary Pill in Sidebar */}
      {metrics && (
        <div className="px-4 mt-auto pt-4 border-t border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Ops Health</span>
              {metrics.overdue_posting > 0 && (
                <span className="flex items-center gap-1 text-rose-600 font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  {metrics.overdue_posting} Overdue
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="block font-bold text-slate-900 text-sm">{metrics.ready_to_post}</span>
                <span className="text-[10px] text-slate-500">Ready</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="block font-bold text-slate-900 text-sm">{metrics.posted}</span>
                <span className="text-[10px] text-slate-500">Posted</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
