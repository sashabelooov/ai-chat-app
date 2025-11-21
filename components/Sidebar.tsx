import React from 'react';
import { MessageSquare, Settings, User, LogOut, Plus, PanelLeftClose } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside 
        className={`fixed md:static inset-y-0 left-0 z-30 bg-[#171717] flex flex-col transition-all duration-300 ease-in-out border-r border-gray-800 ${isOpen ? 'w-[260px] translate-x-0' : '-translate-x-full w-0 opacity-0 overflow-hidden'}`}
      >
        {/* Header */}
        <div className="p-3 flex items-center justify-between gap-2">
          <button 
            onClick={onNewChat}
            className="flex-1 flex items-center gap-2 bg-[#212121] hover:bg-[#2f2f2f] text-gray-200 px-3 py-2 rounded-lg transition-colors text-sm font-medium border border-gray-700"
          >
            <Plus size={16} />
            <span>New chat</span>
          </button>
          <button 
            onClick={toggleSidebar} 
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          <div className="text-xs font-semibold text-gray-500 px-3 py-2">Recent</div>
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate flex items-center gap-3 transition-colors group ${
                currentSessionId === session.id 
                  ? 'bg-[#2f2f2f] text-white' 
                  : 'text-gray-400 hover:bg-[#212121] hover:text-gray-200'
              }`}
            >
              <MessageSquare size={14} className={currentSessionId === session.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
              <span className="truncate">{session.title}</span>
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-gray-800 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg transition-colors">
            <User size={18} />
            <span>Account</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg transition-colors">
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};