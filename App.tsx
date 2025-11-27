import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, MessageType, GeminiModel, Attachment } from './types';
import { DEFAULT_MODEL, MODEL_LABELS } from './constants';
import { streamGeminiResponse, generateImageContent } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { SparklesIcon, TrashIcon } from './components/Icon';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: Role.MODEL,
      type: MessageType.TEXT,
      content: "Hello! I'm your Gemini AI assistant. How can I help you today?\n\nI can help you with analysis, writing code, or even generating images if you ask nicely!",
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<GeminiModel>(DEFAULT_MODEL);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle window resize (virtual keyboard)
  useEffect(() => {
    const handleResize = () => scrollToBottom();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = async (text: string, attachment?: Attachment) => {
    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      role: Role.USER,
      type: MessageType.TEXT,
      content: text,
      timestamp: Date.now(),
      attachment: attachment
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Prepare placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMsgId,
      role: Role.MODEL,
      type: MessageType.TEXT,
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    const isImageGenRequest = currentModel === GeminiModel.IMAGE_GEN; 

    if (isImageGenRequest) {
        // Image Generation Flow
        setMessages(prev => [...prev, { ...aiPlaceholder, isStreaming: true, content: 'Generating image...' }]);
        
        try {
            const imageBase64 = await generateImageContent(text);
            
            setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId 
                ? { 
                    ...msg, 
                    type: MessageType.IMAGE, 
                    content: imageBase64, 
                    isStreaming: false 
                  } 
                : msg
            ));
        } catch (error) {
             setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId 
                ? { ...msg, type: MessageType.ERROR, content: "Sorry, I couldn't generate that image.", isStreaming: false } 
                : msg
            ));
        } finally {
            setIsLoading(false);
        }

    } else {
        // Text/Chat Flow
        setMessages(prev => [...prev, aiPlaceholder]);
        
        try {
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }] 
            }));

            let accumulatedText = "";
            
            await streamGeminiResponse(
                {
                    model: currentModel,
                    prompt: text,
                    attachment: attachment,
                    history: history
                },
                (chunk) => {
                    accumulatedText += chunk;
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMsgId 
                        ? { ...msg, content: accumulatedText } 
                        : msg
                    ));
                }
            );

            setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId 
                ? { ...msg, isStreaming: false } 
                : msg
            ));

        } catch (error) {
            setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId 
                ? { ...msg, type: MessageType.ERROR, content: "I encountered an error. Please check your connection or API key.", isStreaming: false } 
                : msg
            ));
        } finally {
            setIsLoading(false);
        }
    }
  };

  const clearHistory = () => {
    setMessages([messages[0]]); 
  };

  return (
    // h-[100dvh] ensures it fits exactly on mobile screens including browser bars
    <div className="flex flex-col h-[100dvh] bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {/* Header */}
      <header className="flex-none px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10 sticky top-0 pt-[env(safe-area-inset-top)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <SparklesIcon />
            </div>
            <h1 className="font-bold text-lg tracking-tight hidden sm:block">Gemini <span className="text-blue-400 font-light">Omni</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Model Selector */}
             <div className="relative group">
                <select 
                    value={currentModel}
                    onChange={(e) => setCurrentModel(e.target.value as GeminiModel)}
                    className="appearance-none bg-slate-800 border border-slate-700 text-xs sm:text-sm rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer hover:bg-slate-750 transition-colors max-w-[140px] truncate"
                    disabled={isLoading}
                >
                    {Object.entries(MODEL_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
             </div>

             <button 
                onClick={clearHistory}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Clear Chat"
             >
                <TrashIcon />
             </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-2 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full justify-end pb-2">
             {/* Empty State / Welcome */}
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                    <SparklesIcon />
                    <p className="mt-2 text-sm">Start a conversation...</p>
                </div>
            )}

            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}
            
            <div ref={messagesEndRef} className="h-2" />
        </div>
      </main>

      {/* Footer / Input - pb-[env...] handles iPhone Home Bar */}
      <footer className="flex-none bg-slate-900 border-t border-slate-800/50 pb-[env(safe-area-inset-bottom)]">
         <ChatInput onSend={handleSend} isLoading={isLoading} />
      </footer>

    </div>
  );
};

export default App;