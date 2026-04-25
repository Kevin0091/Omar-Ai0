/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth, AuthProvider } from "./hooks/useAuth";
import { ChatApp } from "./components/ChatApp";
import { LogIn } from "lucide-react";

function LoginScreen() {
  const { login } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4 font-sans select-none">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 text-center ring-1 ring-white/5">
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <span className="text-3xl font-bold text-white tracking-tighter">OAI</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Welcome to OmarAI</h1>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          Sign in to interact with an intelligent, full-stack AI assistant with real-time responses.
        </p>
        
        <button
          onClick={login}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
      </div>
      <div className="mt-8 text-sm text-slate-600 flex items-center justify-center">
            Designed for scalability and modern UI/UX.
      </div>
    </div>
  );
}

function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return user ? <ChatApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(71, 85, 105, 0.5);
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 116, 139, 0.8);
        }
      `}</style>
    </AuthProvider>
  );
}

