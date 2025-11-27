import React from 'react';
import { Message, Role, MessageType } from '../types';
import { SparklesIcon } from './Icon';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
          {isUser ? (
            <span className="text-xs font-bold text-white">YOU</span>
          ) : (
            <SparklesIcon />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                isUser 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-sm'
            }`}>
                {/* Render Attached Image if exists */}
                {message.attachment && (
                    <div className="mb-3 max-w-full overflow-hidden rounded-lg border border-white/20">
                        <img 
                            src={`data:${message.attachment.mimeType};base64,${message.attachment.data}`} 
                            alt="User upload" 
                            className="max-h-64 object-cover"
                        />
                    </div>
                )}
                
                {/* Render Generated Image if message type is Image */}
                {message.type === MessageType.IMAGE && (
                     <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-white/10">
                        <img 
                            src={message.content} 
                            alt="AI Generated" 
                            className="max-h-96 object-contain"
                        />
                    </div>
                )}

                {/* Render Text Content */}
                {message.type !== MessageType.IMAGE && (
                     <span>{message.content}</span>
                )}
                
                {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 align-middle bg-blue-400 animate-pulse" />
                )}
            </div>
            
            <span className="text-xs text-slate-500 px-1">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
