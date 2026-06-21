"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth.tsx';
import { Bell, Sparkles, Check, X, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface SystemNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export const SystemNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Fetch Notifications Error]:', error);
    } else if (data) {
      setNotifications(data as SystemNotification[]);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Subscribe to Postgres changes on notifications table for the current user
    const channel = supabase
      .channel(`system_notifications_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Close on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notif: SystemNotification) => {
    setOpen(false);
    
    // Mark as read in background
    if (!notif.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id);
      
      // Update local state quickly
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }

    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    
    // Update local state
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
  };

  const handleClearNotifications = async () => {
    if (!user || notifications.length === 0) return;
    
    // Update local state
    setNotifications([]);
    
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-zinc-400 hover:text-[#FAF8F5] transition-colors rounded-sm hover:bg-[#1F1F1F]"
        title="Notificaciones de sistema"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#C9A962] rounded-full flex items-center justify-center animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F] bg-[#0F0F0F] select-none">
            <h3 className="font-primary text-xs font-bold uppercase tracking-widest text-[#FAF8F5]">
              Sistema y Optimización
            </h3>
            {unreadCount > 0 && (
              <span className="text-[9px] font-primary bg-[#C9A962]/10 border border-[#C9A962]/20 text-[#C9A962] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide">
                {unreadCount} Nuevas
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#111111]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center select-none">
                <Bell className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs font-primary text-zinc-600">Sin notificaciones de sistema</p>
              </div>
            ) : (
              notifications.map(notif => {
                const isVideo = notif.type?.startsWith('video_');
                const isSuccess = notif.type?.endsWith('_success');
                
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 transition-colors flex items-start gap-3 cursor-pointer ${
                      notif.is_read ? 'hover:bg-[#111111] bg-transparent' : 'bg-[#C9A962]/5 hover:bg-[#C9A962]/10'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isVideo ? (
                        isSuccess ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-[#C9A962] animate-pulse" />
                        )
                      ) : (
                        <Bell className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-primary font-bold ${notif.is_read ? 'text-[#FAF8F5]' : 'text-[#C9A962]'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[10px] font-primary text-zinc-400 mt-0.5 leading-normal">
                        {notif.message}
                      </p>
                      <span className="text-[8px] font-primary text-zinc-600 mt-1 block select-none">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    {!notif.is_read && (
                      <span className="w-1.5 h-1.5 bg-[#C9A962] rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#1F1F1F] bg-[#070707] text-[10px] font-primary select-none">
              {unreadCount > 0 ? (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-zinc-400 hover:text-[#C9A962] transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> Marcar leídas
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleClearNotifications}
                className="flex items-center gap-1 text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Borrar todo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
