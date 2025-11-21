import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Mic, Search, BrainCircuit, Image as ImageIcon, X, ChevronDown } from 'lucide-react';
import { AVAILABLE_MODELS, ModelConfig } from '../types';

interface InputAreaProps {
  onSend: (text: string, model: string, search: boolean, deepThink: boolean, images: File[]) => void;
  isCentered: boolean;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, isCentered, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(AVAILABLE_MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useDeepThink, setUseDeepThink] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  // Close model menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if ((!prompt.trim() && attachedFiles.length === 0) || isLoading) return;
    onSend(prompt, selectedModel.modelName, useSearch, useDeepThink, attachedFiles);
    setPrompt('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`w-full mx-auto transition-all duration-500 ease-out ${isCentered ? 'max-w-2xl' : 'max-w-3xl'}`}>
      
      {/* Prompt Input Container */}
      <div className="bg-[#2f2f2f] rounded-3xl shadow-lg border border-gray-700/50 relative flex flex-col">
        
        {/* File Previews */}
        {attachedFiles.length > 0 && (
          <div className="px-4 pt-4 flex gap-3 overflow-x-auto custom-scrollbar">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="relative group shrink-0">
                <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Paperclip size={20} className="text-gray-400" />
                  )}
                </div>
                <button 
                  onClick={() => removeFile(idx)}
                  className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isCentered ? "How can I help you today?" : "Message Nexus AI..."}
          className="w-full bg-transparent text-gray-100 placeholder-gray-500 px-5 py-4 outline-none resize-none min-h-[60px] max-h-[200px] text-[16px]"
          rows={1}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          
          {/* Left Tools: Images, Search, DeepThink */}
          <div className="flex items-center gap-2">
            
            {/* Image Upload */}
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              multiple 
              onChange={handleFileChange}
              accept="image/*"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-full transition-colors"
              title="Attach Image"
            >
              <ImageIcon size={20} />
            </button>

            {/* Toggle Buttons */}
            <button 
              onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${useSearch ? 'bg-[#1a2e1f] text-green-400 border border-green-500/30' : 'text-gray-400 hover:bg-[#424242]'}`}
            >
              <Search size={13} />
              <span>Search</span>
            </button>

            <button 
              onClick={() => setUseDeepThink(!useDeepThink)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${useDeepThink ? 'bg-sky-500/15 text-sky-400 border border-sky-400/30' : 'text-gray-400 hover:bg-[#424242]'}`}
              title="DeepThink (Uses extra reasoning tokens)"
            >
              <BrainCircuit size={13} />
              <span>DeepThink</span>
            </button>
          </div>

          {/* Right Actions: Model, Voice, Send */}
          <div className="flex items-center gap-1">
            
            {/* Model Selection Dropdown */}
            <div className="relative mr-1" ref={modelMenuRef}>
              <button 
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#424242] px-3 py-2 rounded-lg transition-colors"
                title="Select Model"
              >
                <span>{selectedModel.displayName}</span>
                <ChevronDown size={12} />
              </button>
              
              {isModelMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                   <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Select Model
                   </div>
                   {AVAILABLE_MODELS.map((model) => (
                     <button
                       key={model.modelName}
                       onClick={() => {
                         setSelectedModel(model);
                         setIsModelMenuOpen(false);
                       }}
                       className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between group transition-colors ${
                         selectedModel.modelName === model.modelName 
                           ? 'bg-[#2f2f2f] text-white' 
                           : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
                       }`}
                     >
                       <span>{model.displayName}</span>
                       {model.isThinkingSupported && (
                         <BrainCircuit size={12} className="text-sky-500/70" />
                       )}
                     </button>
                   ))}
                </div>
              )}
            </div>

            <button 
              className="p-2 text-gray-400 hover:text-white hover:bg-[#424242] rounded-full transition-colors"
              title="Voice Assistant"
            >
              <Mic size={20} />
            </button>

            <button 
              onClick={handleSend}
              disabled={(!prompt && attachedFiles.length === 0) || isLoading}
              className={`ml-1 p-2 rounded-full transition-all duration-200 ${
                (prompt || attachedFiles.length > 0) && !isLoading
                  ? 'bg-white text-black hover:bg-gray-200 shadow-md transform hover:scale-105' 
                  : 'bg-[#424242] text-gray-600 cursor-not-allowed'
              }`}
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          Nexus AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};
