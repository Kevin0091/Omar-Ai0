import { MessageSquare, Plus, LogOut, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";
import { Chat } from "../types";

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
}

export function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, isOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  
  return (
    <div className={cn(
      "w-72 bg-slate-900/50 flex flex-col transition-all duration-300 z-20 h-full border-r border-slate-800",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 absolute md:relative"
    )}>
      {/* New chat button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 p-3 text-sm font-medium rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <Plus size={20} className="text-indigo-400" />
          New Conversation
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 custom-scrollbar space-y-1">
        <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent History</h3>
        <div className="space-y-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 text-sm rounded-lg text-left truncate transition-colors",
                currentChatId === chat.id 
                  ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-100" 
                  : "hover:bg-slate-800/50 text-slate-400"
              )}
            >
              <MessageSquare size={16} className={cn("shrink-0", currentChatId === chat.id ? "text-indigo-400" : "")} />
              <span className="truncate flex-1">{chat.title}</span>
            </button>
          ))}
          {chats.length === 0 && (
            <div className="text-xs text-slate-500 text-center py-4">No chats yet.</div>
          )}
        </div>
      </div>

      {/* User area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3 w-full p-2 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
             {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-slate-200">{user?.displayName || 'User'}</div>
            <p className="text-xs text-slate-500 truncate">Pro Account</p>
          </div>
          <button onClick={logout} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="Log out">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
