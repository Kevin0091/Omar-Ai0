import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Chat, Message, MessageAttachment } from "../types";
import { streamChatWithGemini } from "../services/gemini";
import { Menu, Search, X } from "lucide-react";
import { PROMPT_TEMPLATES } from "../constants";

export function ChatApp() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingBotMessage, setStreamingBotMessage] = useState<Message | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const chatsRef = collection(db, `users/${user.uid}/chats`);
    const q = query(chatsRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData: Chat[] = [];
      snapshot.forEach((doc) => {
        chatData.push({ id: doc.id, ...doc.data() } as Chat);
      });
      setChats(chatData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/chats`));

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !currentChatId) {
      setMessages([]);
      return;
    }
    const msgsRef = collection(db, `users/${user.uid}/chats/${currentChatId}/messages`);
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgsData: Message[] = [];
      snapshot.forEach((doc) => {
        msgsData.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/chats/${currentChatId}/messages`));

    return () => unsubscribe();
  }, [user, currentChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingBotMessage]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const createChatIfNone = async (firstMessageText: string) => {
    if (currentChatId) return currentChatId;
    
    // Generate a title
    let title = firstMessageText.substring(0, 40);
    if (firstMessageText.length > 40) title += "...";

    const newChatId = uuidv4();
    const chatRef = doc(db, `users/${user!.uid}/chats/${newChatId}`);
    try {
        await setDoc(chatRef, {
            title,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        setCurrentChatId(newChatId);
        return newChatId;
    } catch(err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user!.uid}/chats/${newChatId}`);
        return null;
    }
  };

  const handleSend = async (text: string, attachments: MessageAttachment[]) => {
    if (!user) return;
    
    setIsGenerating(true);
    let targetChatId = currentChatId;
    
    try {
        targetChatId = await createChatIfNone(text);
        if(!targetChatId) {
            setIsGenerating(false);
            return;
        }

        // Add user message to DB
        const userMsgRef = doc(collection(db, `users/${user.uid}/chats/${targetChatId}/messages`));
        await setDoc(userMsgRef, {
            role: "user",
            text: text,
            // Attachments tracking omitted for simplicity in DB, but included in API prompt
            createdAt: serverTimestamp()
        });

        // Update chat updatedAt
        const updateRef = doc(db, `users/${user.uid}/chats/${targetChatId}`);
        updateDoc(updateRef, { updatedAt: serverTimestamp() }).catch(e => console.error(e));

        // Format history for Gemini
        const historyForGemini = messages.map(m => ({
            role: (m.role === "model" ? "model" : "user") as "model" | "user",
            parts: [{ text: m.text }]
        }));

        // create a placeholder for the bot message
        const botMsgRef = doc(collection(db, `users/${user.uid}/chats/${targetChatId}/messages`));
        let botText = "";
        
        setStreamingBotMessage({
             id: botMsgRef.id,
             role: "model",
             text: "",
             createdAt: Date.now()
        });

        let accumulatedStream = "";
        const stream = streamChatWithGemini(historyForGemini, text, attachments);
        for await (const chunk of stream) {
            accumulatedStream += chunk;
            botText = accumulatedStream;
            
            setStreamingBotMessage(prev => prev ? { ...prev, text: botText } : null);
        }

        // Save final bot message to DB
        await setDoc(botMsgRef, {
            role: "model",
            text: botText,
            createdAt: serverTimestamp()
        });
        
        setStreamingBotMessage(null);

    } catch (error) {
        console.error(error);
        if (targetChatId) {
             const errorMsgRef = doc(collection(db, `users/${user.uid}/chats/${targetChatId}/messages`));
             setDoc(errorMsgRef, {
                 role: "model",
                 text: "Sorry, I encountered an error. Please try again.",
                 createdAt: serverTimestamp()
             }).catch(console.error);
        }
    } finally {
        setIsGenerating(false);
    }
  };

  const handleTemplateClick = (prompt: string) => {
    handleSend(prompt, []); // No attachments
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans select-none">
      
      <Sidebar 
        chats={chats} 
        currentChatId={currentChatId} 
        onSelectChat={handleSelectChat} 
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
      />
      
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-10 md:hidden" 
            onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-300 md:hidden rounded-md focus:outline-none transition-colors"
            >
                <Menu size={20} />
            </button>
            <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-300 shrink-0">OmarAI Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:block px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700">Share</button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto w-full custom-scrollbar relative">
            {messages.length === 0 && !streamingBotMessage ? (
                <div className="h-full flex flex-col items-center justify-center p-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
                        <Search className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-8 text-slate-100">How can I help you today?</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full px-4 mb-12">
                        {PROMPT_TEMPLATES.map((tmpl, i) => (
                            <button
                                key={i}
                                onClick={() => handleTemplateClick(tmpl.prompt)}
                                className="text-left py-4 px-5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors shadow-sm group"
                            >
                                <div className="font-medium mb-1 text-slate-200">{tmpl.title}</div>
                                <div className="text-sm text-slate-500 line-clamp-2">{tmpl.prompt}</div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-4 md:p-8 space-y-8 pb-32">
                    {messages.map(m => (
                        <ChatMessage key={m.id} message={m} />
                    ))}
                    {streamingBotMessage && <ChatMessage key={streamingBotMessage.id} message={streamingBotMessage} />}
                    <div ref={bottomRef} />
                </div>
            )}
        </section>

        <footer className="absolute bottom-0 inset-x-0 p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-12 shrink-0">
            <ChatInput onSend={handleSend} disabled={isGenerating} />
        </footer>
      </main>
    </div>
  );
}
