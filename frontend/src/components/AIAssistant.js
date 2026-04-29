import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { X, Send, Bot, Sparkles, Loader2, MessageSquare, ChevronRight, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AIAssistant = () => {
    const { isAuthenticated, token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your HiDoctor Clinical AI. Describe your symptoms or health concerns, and I will find the most suitable elite specialist for you.' }
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
            { role: 'assistant', content: 'Please sign in to access personalized clinical recommendations.' }
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

            const { recommendation, doctors } = response.data;

            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: recommendation, 
                doctors: doctors || [] 
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I encountered a clinical processing error. Please try again or explore our directory manually.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Trigger */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 left-8 z-[110] w-16 h-16 rounded-3xl bg-slate-950 text-white shadow-2xl flex items-center justify-center border border-white/10 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    {isOpen ? <X className="w-8 h-8" /> : (
                        <div className="relative">
                            <Bot className="w-8 h-8" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
                        </div>
                    )}
                </div>
            </motion.button>

            {/* AI Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        className="fixed bottom-28 left-8 z-[110] w-[420px] max-w-[calc(100vw-4rem)] bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(239,68,68,0.15)] border border-orange-100 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-slate-950 p-8 text-white relative overflow-hidden">
                            <div className="absolute inset-0 mesh-orange-red opacity-20" />
                            <div className="relative z-10 flex items-center gap-5">
                                <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <BrainCircuit className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl tracking-tighter">HiDoctor AI</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Clinical Protocol 2.4.1</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 h-[450px] overflow-y-auto p-8 space-y-6 bg-slate-50/50 sidebar-scroll">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-[2rem] px-6 py-4 shadow-sm relative ${msg.role === 'user'
                                        ? 'bg-orange-600 text-white rounded-br-none font-bold text-sm'
                                        : 'bg-white text-slate-900 border border-slate-100 rounded-bl-none font-medium text-sm leading-relaxed'
                                        }`}>
                                        {msg.content}
                                        
                                        {msg.doctors && msg.doctors.length > 0 && (
                                            <div className="mt-6 space-y-3">
                                                {msg.doctors.map((doc, j) => (
                                                    <motion.button
                                                        whileHover={{ x: 5 }}
                                                        key={j}
                                                        onClick={() => { navigate(`/doctors/${doc.user_id}`); setIsOpen(false); }}
                                                        className="w-full text-left p-4 rounded-2xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-all flex items-center justify-between group"
                                                    >
                                                        <div>
                                                            <p className="font-black text-xs text-slate-900">Dr. {doc.name}</p>
                                                            <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">{doc.specialties?.[0] || 'Specialist'}</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                                                    </motion.button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-100 rounded-[2rem] rounded-bl-none px-6 py-4 shadow-sm">
                                        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Controls */}
                        <div className="p-8 bg-white border-t border-slate-100 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Budget (₹):</span>
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        placeholder="Optional"
                                        className="bg-transparent border-none focus:ring-0 p-0 text-xs font-black text-slate-900 w-full"
                                    />
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Describe clinical symptoms..."
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                />
                                <Button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="rounded-2xl bg-slate-950 hover:bg-orange-600 text-white h-14 w-14 flex-shrink-0 shadow-xl"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>

                            {!isAuthenticated && (
                                <Button
                                    onClick={() => { navigate('/login'); setIsOpen(false); }}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.2em]"
                                >
                                    Login for Clinical Synthesis
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;
