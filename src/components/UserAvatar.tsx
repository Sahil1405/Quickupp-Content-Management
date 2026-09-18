import React from 'react';
import { User, UserRole } from '../types';

interface UserAvatarProps {
  user?: User;
  name?: string;
  avatar?: string;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showRole?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name,
  avatar,
  role,
  size = 'md',
  showRole = false,
  className = '',
}) => {
  const displayName = user?.name || name || 'User';
  const displayAvatar = user?.avatar || avatar;
  const displayRole = user?.role || role;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    editor: 'bg-amber-100 text-amber-800 border-amber-200',
    poster: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-slate-200 text-slate-700 font-medium ${sizeClasses[size]}`}>
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback to initials on broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{getInitials(displayName)}</span>
        )}
      </div>

      {showRole && displayRole && (
        <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${roleColors[displayRole]}`}>
          {displayRole}
        </span>
      )}
    </div>
  );
};
