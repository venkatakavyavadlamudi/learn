import React, { useState, useRef, useEffect } from 'react';
import { askAiAssistant, ChatMessage } from '../services/geminiService';
import { Sparkles, Send, Loader2, Bot, User as UserIcon, RotateCcw, Info, Check } from 'lucide-react';

interface AiAssistantCardProps {
  initialCourseContext?: string;
  initialQuestion?: string;
}

export const AiAssistantCard: React.FC<AiAssistantCardProps> = ({
  initialCourseContext,
  initialQuestion,
}) => {
  const [input, setInput] = useState(initialQuestion || '');
  const [courseContext, setCourseContext] = useState<string>(initialCourseContext || 'General Course Help');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: "Hello! I am your AI Learning Assistant. You can ask me to explain concepts from your courses (Python, Machine Learning, Generative AI, SQL), debug logic, or suggest practice problems. How can I help your learning today?",
      timestamp: 'Just now',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuestion) {
      setInput(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    if (initialCourseContext) {
      setCourseContext(initialCourseContext);
    }
  }, [initialCourseContext]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const result = await askAiAssistant(query, messages, courseContext);

    const modelMessage: ChatMessage = {
      id: 'bot_' + Date.now(),
      role: 'model',
      text: result.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, modelMessage]);
    setIsLoading(false);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-msg-reset',
        role: 'model',
        text: "Conversation cleared. Feel free to ask a new question about your syllabus or career path!",
        timestamp: 'Just now',
      },
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestions = [
    'Explain Python list comprehension vs map',
    'How does Gradient Descent work in ML?',
    'What is the difference between RAG and Fine-tuning?',
    'Write an example of a SQL window function',
  ];

  return (
    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-2xl overflow-hidden flex flex-col">
      {/* Top Banner */}
      <div className="bg-[#101412] p-5 sm:p-6 border-b border-[#29312C]">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl gradient-uniconnect flex items-center justify-center text-[#0A0D0C] shadow-sm">
              <Sparkles className="w-5 h-5 text-[#0A0D0C]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight text-[#F5F7F6]">
                AI Learning Assistant
              </h2>
              <p className="text-xs text-[#A3ADA7] mt-0.5">
                Ask questions about your courses and learning journey.
              </p>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-[#1B211E] hover:bg-[#202724] text-[#A3ADA7] hover:text-[#F5F7F6] text-xs flex items-center gap-1 transition-colors border border-[#29312C]"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Course Context Pill */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#A3ADA7] font-medium">Context:</span>
          <select
            value={courseContext}
            onChange={(e) => setCourseContext(e.target.value)}
            className="bg-[#151A18] text-[#F5F7F6] text-xs rounded-lg px-2.5 py-1 border border-[#29312C] focus:outline-none focus:ring-1 focus:ring-[#32D6B0]"
          >
            <option key="ctx-all" value="General Course Help" className="bg-[#151A18] text-[#F5F7F6]">All Enrolled Courses</option>
            <option key="ctx-python" value="Python Programming" className="bg-[#151A18] text-[#F5F7F6]">Python Programming</option>
            <option key="ctx-ml" value="Machine Learning Fundamentals" className="bg-[#151A18] text-[#F5F7F6]">Machine Learning Fundamentals</option>
            <option key="ctx-genai" value="Generative AI Fundamentals" className="bg-[#151A18] text-[#F5F7F6]">Generative AI Fundamentals</option>
            <option key="ctx-sql" value="SQL Fundamentals" className="bg-[#151A18] text-[#F5F7F6]">SQL Fundamentals</option>
          </select>
          <span className="text-[11px] text-[#32D6B0] bg-[#1B211E] px-2 py-0.5 rounded border border-[#29312C] hidden md:inline-flex items-center gap-1">
            <Info className="w-3 h-3 text-[#32D6B0]" />
            Direct AI Tutor
          </span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="p-4 sm:p-6 bg-[#151A18] max-h-80 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                msg.role === 'user'
                  ? 'bg-[#1B211E] text-[#32D6B0] border border-[#29312C]'
                  : 'gradient-uniconnect text-[#0A0D0C]'
              }`}
            >
              {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#0A0D0C]" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#1B211E] text-[#32D6B0] border border-[#29312C] rounded-tr-none'
                  : 'bg-[#101412] text-[#F5F7F6] border border-[#29312C] rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              <div
                className={`flex items-center justify-between mt-2 pt-1 border-t text-[10px] ${
                  msg.role === 'user'
                    ? 'border-[#29312C] text-[#32D6B0]/70'
                    : 'border-[#29312C] text-[#A3ADA7]'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.role === 'model' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="hover:text-[#32D6B0] flex items-center gap-1 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-[#78D98A]" />
                        <span className="text-[#78D98A]">Copied</span>
                      </>
                    ) : (
                      <span>Copy</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl gradient-uniconnect text-[#0A0D0C] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#0A0D0C]" />
            </div>
            <div className="bg-[#101412] border border-[#29312C] rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-2 text-xs text-[#A3ADA7]">
              <Loader2 className="w-4 h-4 animate-spin text-[#32D6B0]" />
              <span>Analyzing course material and generating answer...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="px-4 py-2 bg-[#101412] border-t border-[#29312C]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[#A3ADA7] text-[11px] shrink-0 font-medium">Suggestions:</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-xs bg-[#151A18] hover:bg-[#1B211E] text-[#A3ADA7] hover:text-[#32D6B0] px-3 py-1 rounded-lg whitespace-nowrap transition-colors border border-[#29312C] shrink-0"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 bg-[#101412] border-t border-[#29312C]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something about your learning..."
            disabled={isLoading}
            className="flex-1 bg-[#151A18] border border-[#29312C] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F5F7F6] placeholder-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0] transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 gradient-uniconnect hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0D0C] text-xs font-bold rounded-xl shadow-md glow-teal-sm transition-all shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0A0D0C]" />
            ) : (
              <>
                <span>Ask AI</span>
                <Send className="w-4 h-4 text-[#0A0D0C]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
