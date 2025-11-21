import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { InputArea } from './components/InputArea';
import { Message, Role, ChatSession } from './types';
import { PanelLeftOpen, Plus, Fish, User as UserIcon } from 'lucide-react';
import { streamChatResponse } from './services/geminiService';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Save the current messages to the session list
  const saveCurrentSession = () => {
    if (messages.length === 0) return;

    if (currentSessionId) {
      // Update existing session
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...messages] }
          : session
      ));
    } else {
      // Fallback: Create new session if ID is missing (should usually be handled in handleSend)
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId,
        title: messages[0].text.slice(0, 30) || 'New Chat',
        date: 'Today',
        messages: [...messages]
      };
      setSessions(prev => [newSession, ...prev]);
    }
  };

  const handleNewChat = () => {
    if (isLoading) return;
    saveCurrentSession(); // Save current chat before clearing
    setMessages([]);
    setCurrentSessionId(null);
    if (!isSidebarOpen) setIsSidebarOpen(true);
  };

  const handleSelectSession = (id: string) => {
    if (isLoading) return;
    if (currentSessionId === id) return;

    saveCurrentSession(); // Save previous chat

    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(id);
    }
  };

  const handleSend = async (text: string, model: string, search: boolean, deepThink: boolean, files: File[]) => {
    if (!text.trim() && files.length === 0) return;

    let activeSessionId = currentSessionId;

    // 1. Create New Session if this is the first message
    if (!activeSessionId) {
      activeSessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: activeSessionId,
        title: text.slice(0, 40) + (text.length > 40 ? '...' : ''),
        date: 'Today',
        messages: [] // Messages will be synced via the messages state
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(activeSessionId);
    }

    // 2. Process files
    const base64Images = await Promise.all(files.map(fileToBase64));

    // 3. Create User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      timestamp: Date.now(),
      images: base64Images
    };

    // 4. Update Messages State (Optimistic)
    setMessages(prev => {
      const updated = [...prev, userMsg];
      // Sync with session list immediately to show preview/existence
      setSessions(currentSessions => currentSessions.map(s => 
        s.id === activeSessionId ? { ...s, messages: updated } : s
      ));
      return updated;
    });
    
    setIsLoading(true);

    // 5. Create Placeholder AI Message
    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiMsgId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, initialAiMsg]);

    try {
      // 6. Call API
      await streamChatResponse({
        model,
        prompt: text,
        history: messages,
        useSearch: search,
        useDeepThink: deepThink,
        images: base64Images
      }, (chunk) => {
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, text: msg.text + chunk } : msg
          );
          
          // Keep session in sync during streaming (optional, but good for data consistency)
          setSessions(currentSessions => currentSessions.map(s => 
            s.id === activeSessionId ? { ...s, messages: updatedMessages } : s
          ));
          
          return updatedMessages;
        });
      });
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, text: "Sorry, I encountered an error connecting to the API. Make sure your local server is running on port 8000 and CORS is enabled.", isError: true } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const isChatEmpty = messages.length === 0;

  return (
    <div className="flex h-screen w-full bg-[#212121] text-gray-100 overflow-hidden relative">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />

      {/* DeepSeek-style Collapsed Nav (Visible when sidebar is closed) */}
      {!isSidebarOpen && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-4 animate-fade-in">
          {/* Logo */}
          <div className="text-blue-500">
            <Fish size={32} /> 
          </div>
          
          {/* Oval Pill Buttons */}
          <div className="flex items-center bg-[#2f2f2f] rounded-full p-1 border border-gray-700 shadow-lg">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-full transition-colors"
              title="Open Sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
            <button 
              onClick={handleNewChat}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-full transition-colors"
              title="New Chat"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full min-w-0">
        
        {/* Top Right Header Buttons */}
        <div className="absolute top-4 right-4 z-40">
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors shadow-sm">
            Sign up
          </button>
        </div>

        {/* Header (Title) - Only visible when sidebar is open to avoid clash with floating nav */}
        {isSidebarOpen && (
          <header className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-center md:justify-start bg-gradient-to-b from-[#212121] to-transparent pointer-events-none">
            <span className="ml-2 font-semibold text-gray-200 opacity-50 text-sm md:text-base">Nexus AI 1.0</span>
          </header>
        )}

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
          
          {isChatEmpty ? (
            // Empty State (Hero)
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="mb-8 text-center space-y-6 animate-fade-in">
                 <div className="bg-white/5 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm">
                   <Fish size={40} className="text-blue-400" />
                 </div>
                 {/* Note: InputArea will be placed here via absolute positioning logic below */}
              </div>
            </div>
          ) : (
            // Messages List
            <div className="max-w-3xl mx-auto w-full space-y-8 py-20 px-4 md:px-6">
              {messages.map((msg, index) => {
                // Determine if this message is currently being streamed
                const isLastMessage = index === messages.length - 1;
                const isStreaming = isLoading && msg.role === Role.MODEL && isLastMessage;

                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-4 animate-fade-in ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
                  >
                     {/* Avatar for Model */}
                     {msg.role === Role.MODEL && (
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                        <Fish size={18} className="text-white" />
                      </div>
                    )}
  
                    <div className={`flex flex-col max-w-[85%] md:max-w-[75%] space-y-2 ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
                      
                      {/* User Images */}
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 justify-end">
                          {msg.images.map((img, i) => (
                            <img key={i} src={img} alt="uploaded" className="rounded-xl max-w-[200px] max-h-[200px] object-cover border border-gray-600" />
                          ))}
                        </div>
                      )}
  
                      {/* Message Bubble */}
                      <div 
                        className={`px-6 py-4 rounded-3xl text-[15px] leading-7 whitespace-pre-wrap shadow-sm ${
                          msg.role === Role.USER 
                            ? 'bg-[#2f2f2f] text-white rounded-tr-sm' 
                            : 'text-gray-100 rounded-tl-sm'
                        } ${msg.isError ? 'text-red-400 border border-red-500/30' : ''}`}
                      >
                        {msg.text}
                        {/* Blinking Cursor for Streaming */}
                        {isStreaming && (
                          <span className="inline-block w-1.5 h-5 ml-1 align-sub bg-blue-400 animate-cursor-blink"></span>
                        )}
                        {/* Thinking placeholder if text is empty */}
                        {isStreaming && !msg.text && (
                          <span className="text-gray-500 italic">Thinking...</span>
                        )}
                      </div>
                    </div>
  
                    {/* Avatar for User */}
                    {msg.role === Role.USER && (
                      <div className="w-9 h-9 rounded-full bg-[#424242] flex items-center justify-center shrink-0 mt-1">
                        <UserIcon size={18} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-32" />
            </div>
          )}
        </div>

        {/* Input Area Container */}
        <div className={`absolute z-30 w-full transition-all duration-500 ease-in-out px-4 ${
          isChatEmpty 
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl' 
            : 'bottom-0 left-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pb-6 pt-10'
        }`}>
           <InputArea 
             onSend={handleSend} 
             isCentered={isChatEmpty}
             isLoading={isLoading}
           />
        </div>

      </main>
    </div>
  );
};

export default App;