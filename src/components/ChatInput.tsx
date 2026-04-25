import { useState, useRef, useEffect } from "react";
import { Send, Upload, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { MessageAttachment, FileType } from "../types";

interface ChatInputProps {
  onSend: (text: string, attachments: MessageAttachment[]) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [text]);

  const handleSubmit = () => {
    if ((text.trim() || attachments.length > 0) && !disabled) {
      onSend(text.trim(), attachments);
      setText("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const base64 = await toBase64(file);
            let type = FileType.IMAGE;
            if (file.type === "application/pdf") {
                type = FileType.PDF;
            }
            setAttachments(prev => [...prev, {
                type,
                mimeType: file.type,
                name: file.name,
                data: base64
            }]);
        } catch (err) {
            console.error("Error reading file", err);
        }
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative max-w-3xl w-full mx-auto">
      <div className="relative">
        
        {attachments.length > 0 && (
            <div className="flex gap-2 p-3 overflow-x-auto absolute bottom-full left-0 right-0 mb-2 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-900/50">
                {attachments.map((file, i) => (
                    <div key={i} className="relative group flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-2 pr-8 shrink-0 max-w-[200px]">
                        {file.type === FileType.IMAGE ? <ImageIcon size={16} className="text-indigo-400 shrink-0"/> : <FileText size={16} className="text-rose-400 shrink-0"/>}
                        <span className="text-xs font-medium truncate text-slate-300">{file.name}</span>
                        <button 
                            onClick={(e) => { e.preventDefault(); removeAttachment(i); }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-200 transition-colors"
                        >
                            <X size={14}/>
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 w-8">
            <button
             type="button" 
             onClick={() => fileInputRef.current?.click()}
             className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
             title="Upload file"
            >
              <Upload size={20} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*,application/pdf"
                onChange={handleFileChange}
            />
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message OmarAI..."
          disabled={disabled}
          className="w-full max-h-[200px] bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-14 pr-16 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 shadow-2xl resize-none custom-scrollbar"
          rows={1}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 w-10 justify-end">
          <button
            onClick={handleSubmit}
            disabled={disabled || (text.trim() === "" && attachments.length === 0)}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            {disabled ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="" />}
          </button>
        </div>
      </div>
      <div className="text-center mt-3">
          <p className="text-[10px] text-slate-600">
             OmarAI can make mistakes. Verify important information.
          </p>
      </div>
    </div>
  );
}
