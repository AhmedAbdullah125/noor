
import React from 'react';
import { Home, Bell, Calendar, User, Ticket } from 'lucide-react';
import { TabId } from '../types';
import { getLang, translations } from '../services/i18n';

interface TabBarProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange }) => {
  const lang = getLang();
  const t = translations[lang];

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t.tabBarHome, icon: <Home size={22} /> },
    { id: 'subscriptions', label: t.tabBarSubscriptions, icon: <Ticket size={22} /> },
    { id: 'notifications', label: t.tabBarNotifications, icon: <Bell size={22} /> },
    { id: 'appointments', label: t.tabBarAppointments, icon: <Calendar size={22} /> },
    { id: 'account', label: t.tabBarAccount, icon: <User size={22} /> },
  ];

  return (
    <div className="fixed max-w-[420px] border-2 border-app-card bottom-1 rounded-3xl left-1/2 -translate-x-1/2 w-full bg-app-bg border-t border-app-card shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-between p-1 flex-nowrap items-end mx-auto gap-2 relative w-full">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center gap-1 transition-all p-1 duration-300 w-full rounded-[20px] ${isActive ? 'bg-app-gold/10 ' : ''} `}
            >
              <div
                className={`
                 flex items-center justify-center p-1 transition-all duration-300
                  ${isActive
                    ? 'text-app-gold transform scale-110 '
                    : 'text-gray-400 hover:text-gray-500'
                  }
                `}
              >
                {tab.icon}
              </div>
              <span className={`text-[10px] transition-colors pb-1 duration-300 ${isActive ? 'text-app-gold' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;
