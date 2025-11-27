import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, ImageIcon, XCircleIcon } from './Icon';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (text: string, attachment?: Attachment) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((!text.trim() && !attachment) || isLoading) return;
    onSend(text, attachment);
    setText('');
    setAttachment(undefined);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 part
        const base64Data = result.split(',')[1];
        setAttachment({
          mimeType: file.type,
          data: base64Data
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeAttachment = () => setAttachment(undefined);

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4">
      {/* Attachment Preview */}
      {attachment && (
        <div className="absolute bottom-full left-6 mb-2 bg-slate-800 p-2 rounded-lg border border-slate-700 shadow-xl flex items-start gap-2 animate-fade-in-up">
            <div className="relative">
                <img 
                    src={`data:${attachment.mimeType};base64,${attachment.data}`} 
                    alt="Preview" 
                    className="h-20 w-20 object-cover rounded-md" 
                />
                <button 
                    onClick={removeAttachment}
                    className="absolute -top-2 -right-2 text-rose-500 bg-slate-900 rounded-full hover:text-rose-400"
                >
                    <XCircleIcon />
                </button>
            </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg flex items-end p-2 gap-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
        
        {/* Upload Button */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-colors disabled:opacity-50"
          disabled={isLoading}
          title="Upload image"
        >
          <ImageIcon />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, or describe an image..."
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 p-3 resize-none outline-none max-h-32 min-h-[44px]"
          rows={1}
          disabled={isLoading}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !attachment) || isLoading}
          className={`p-3 rounded-xl transition-all duration-200 ${
            (!text.trim() && !attachment) || isLoading
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
          }`}
        >
          {isLoading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <SendIcon />
          )}
        </button>
      </div>
      
      <div className="text-center mt-2">
         <p className="text-xs text-slate-500">
             Powered by Gemini 2.5 Flash & 3.0 Pro
         </p>
      </div>
    </div>
  );
};

export default ChatInput;
