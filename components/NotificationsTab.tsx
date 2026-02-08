
import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import AppHeader from './AppHeader';
import { db } from '../services/db';
import { UserNotification } from '../types';
import { translations, getLang } from '../services/i18n';

const NotificationsTab: React.FC = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const userId = 'u1'; // Demo static user ID (matches seeded Nour)
  const [isGuest, setIsGuest] = useState(false);
  const lang = getLang();
  const t = translations[lang] || translations['ar'];

  useEffect(() => {
    const mode = localStorage.getItem('mezo_auth_mode');
    if (mode === 'guest') {
      setIsGuest(true);
      return;
    }

    const fetchNotifs = () => {
      const data = db.getUserNotifications(userId);
      setNotifications(data);
    };

    fetchNotifs();
    window.addEventListener('storage', fetchNotifs);
    return () => window.removeEventListener('storage', fetchNotifs);
  }, []);

  const handleMarkRead = (id: string) => {
    db.markUserNotificationRead(id);
    setNotifications(db.getUserNotifications(userId));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn bg-app-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <AppHeader title={t.notificationsTitle} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
        {isGuest ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 pb-10">
            <div className="w-24 h-24 bg-app-card rounded-full flex items-center justify-center mb-6 text-app-gold">
              <Bell size={40} />
            </div>
            <h2 className="text-base font-semibold text-app-text mb-2">{t.guestNotificationsTitle}</h2>
            <p className="text-sm text-app-textSec">{t.guestNotificationsDesc}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 pb-10">
            <div className="w-24 h-24 bg-app-card rounded-full flex items-center justify-center mb-6 text-app-gold">
              <Bell size={40} />
            </div>
            <h2 className="text-base font-semibold text-app-text mb-2">{t.noNotificationsTitle}</h2>
            <p className="text-sm text-app-textSec">{t.noNotificationsDesc}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`bg-white rounded-[2rem] p-5 shadow-sm border transition-all ${n.isRead ? 'border-app-card/30 opacity-70' : 'border-app-gold/30 shadow-md ring-1 ring-app-gold/10'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-xl ${n.isRead ? 'bg-gray-100 text-gray-400' : 'bg-app-gold/10 text-app-gold'}`}>
                    <Bell size={18} />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-app-textSec font-semibold" dir="ltr">
                    <Clock size={10} />
                    <span>{new Date(n.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-app-text leading-relaxed mb-4">{n.messageText}</p>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-app-bg">
                  {n.linkUrl ? (
                    <a
                      href={n.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-app-gold underline decoration-dotted"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                      <span>{t.viewLink}</span>
                    </a>
                  ) : <div />}

                  {!n.isRead && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <Check size={10} strokeWidth={3} />
                      {t.newBadge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
