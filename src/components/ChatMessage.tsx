import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../types";
import { User, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Ignore system messages from rendering
  if (message.role === "system") return null;

  return (
    <div className="flex gap-4 md:gap-6 max-w-3xl mx-auto w-full group">
      <div className="shrink-0 flex items-start">
        {isUser ? (
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
            <User size={20} className="" />
          </div>
        ) : (
           <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white border border-indigo-400 shadow-lg shadow-indigo-500/20">
             <Sparkles size={20} className="" />
           </div>
        )}
      </div>
      
      <div className="flex-1 overflow-x-auto min-w-0 space-y-2 pt-1 md:pt-1.5">
        <p className="font-semibold text-slate-200 text-sm md:text-base">
          {isUser ? "You" : "OmarAI"}
        </p>
        <div className="text-slate-300 leading-relaxed text-[15px] max-w-none break-words prose prose-invert prose-indigo prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-code:text-indigo-300 prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
          <Markdown 
            remarkPlugins={[remarkGfm]}
          >
            {message.text}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
