import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AIAssistant = () => {
    const { isAuthenticated, token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! 👋 I\'m your HiDoctor AI assistant. Tell me your symptoms and budget, and I\'ll recommend the best doctor for you.' }
    ]);
    const [input, setInput] = useState('');
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (!isAuthenticated) {
            setMessages(prev => [...prev,
            { role: 'user', content: input },
            { role: 'assistant', content: 'Please sign in to get personalized doctor recommendations. Click below to login.' }
            ]);
            setInput('');
            return;
        }

        const userMessage = input;
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/ai/recommend`, {
                symptoms: userMessage,
                budget: budget ? parseFloat(budget) : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { recommendation, doctors, specialties_needed } = response.data;

            let assistantMsg = recommendation;
            if (doctors && doctors.length > 0) {
                assistantMsg += '\n\n**Recommended Doctors:**\n';
                doctors.forEach((doc, i) => {
                    assistantMsg += `\n${i + 1}. **Dr. ${doc.name}** — ${doc.specialties?.join(', ') || 'General'}\n   ⭐ ${doc.rating}/5 | ₹${doc.fee} | ${doc.experience}yrs exp`;
                });
            }

            setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg, doctors }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again or browse doctors manually.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
                id="ai-assistant-btn"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <div className="relative">
                        <Bot className="w-6 h-6" />
                        <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                    </div>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 left-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
                    id="ai-assistant-panel"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">HiDoctor AI</h3>
                                <p className="text-sm text-teal-100">Smart Doctor Finder</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${msg.role === 'user'
                                        ? 'bg-teal-600 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                                    }`}>
                                    {msg.content}
                                    {msg.doctors && msg.doctors.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {msg.doctors.map((doc, j) => (
                                                <button
                                                    key={j}
                                                    onClick={() => {
                                                        navigate(`/doctors/${doc.user_id}`);
                                                        setIsOpen(false);
                                                    }}
                                                    className="block w-full text-left p-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors text-teal-800"
                                                >
                                                    <span className="font-medium text-xs">View Dr. {doc.name} →</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Budget Input */}
                    <div className="px-4 pt-2 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">Budget (₹):</span>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="Optional"
                                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 pt-2 bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Describe your symptoms..."
                                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={loading || !input.trim()}
                                className="rounded-xl bg-teal-600 hover:bg-teal-700 h-10 w-10 flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>

                    {!isAuthenticated && (
                        <div className="px-4 pb-3 bg-white">
                            <Button
                                onClick={() => { navigate('/login'); setIsOpen(false); }}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-sm"
                                size="sm"
                            >
                                Sign in for recommendations
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default AIAssistant;
