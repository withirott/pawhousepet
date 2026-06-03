import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/axios';
import useAuthStore from '../../contexts/useAuthStore';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import io from 'socket.io-client';

const Chats = () => {
    const { user } = useAuthStore();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    const fetchChats = async () => {
        try {
            const res = await api.get('/chats');
            setChats(res.data);
        } catch (error) {
            console.error('Failed to load chats', error);
        }
    };

    const fetchMessages = async (chatId) => {
        try {
            const res = await api.get(`/chats/${chatId}/messages`);
            setMessages(res.data);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    useEffect(() => {
        // Connect to Socket
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
        setSocket(newSocket);

        if (user) {
            newSocket.emit('join_user_room', user.id);
        }

        return () => newSocket.disconnect();
    }, [user]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('receive_message', (message) => {
            // Update messages if we have the chat open
            if (activeChat && message.chat_id === activeChat.id) {
                setMessages((prev) => [...prev, message]);
            }
            
            // Re-fetch chat list to update 'last message' and sorting
            fetchChats();
        });

        return () => {
             socket.off('receive_message');
        };
    }, [socket, activeChat]);

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.id);
        }
    }, [activeChat]);

    // Scroll to bottom when messages load
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);



    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || !socket) return;

        const receiverId = activeChat.buyer_id === user.id ? activeChat.seller_id : activeChat.buyer_id;

        socket.emit('send_message', {
            chatId: activeChat.id,
            senderId: user.id,
            receiverId: receiverId,
            content: newMessage
        });

        setNewMessage('');
    };

    const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-220px)] min-h-[500px] animate-fade-in fade-in">
            
            {/* Chat List Sidebar */}
            <div className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col pt-2 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 bg-white flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center"><FiMessageSquare className="mr-2 text-primary" /> ข้อความแชท</h2>
                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">{chats.length} แชท</span>
                </div>
                
                <div className="flex-1 overflow-y-auto mt-2">
                    {chats.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center text-center opacity-50 h-full">
                            <FiMessageSquare size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">ยังไม่มีประวัติการแชท</p>
                        </div>
                    ) : (
                        chats.map(chat => {
                            const isBuyer = chat.buyer_id === user.id;
                            const partnerName = isBuyer ? chat.seller_name : chat.buyer_name;
                            const partnerImage = isBuyer ? chat.seller_image : chat.buyer_image;
                            const isActive = activeChat?.id === chat.id;
                            
                            return (
                                <div 
                                    key={chat.id} 
                                    onClick={() => setActiveChat(chat)}
                                    className={`p-4 mx-2 mb-1 rounded-2xl cursor-pointer transition-all ${isActive ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-50 bg-white'}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 ${isActive ? 'border-primary-light' : 'border-gray-200 bg-gray-100'}`}>
                                            {partnerImage ? 
                                                <img src={getFullImageUrl(partnerImage)} alt="Partner" className="w-full h-full object-cover" /> 
                                                : <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${isActive ? 'text-white' : 'text-gray-400'}`}>{partnerName.charAt(0)}</div>
                                            }
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className={`font-bold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>{partnerName}</h4>
                                                <span className={`text-[10px] whitespace-nowrap ml-2 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                                    {chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : ''}
                                                </span>
                                            </div>
                                            <p className={`text-xs font-medium truncate mb-1 ${isActive ? 'text-white/90' : 'text-primary'}`}>เรื่อง: {chat.product_name}</p>
                                            <p className={`text-sm truncate ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                                                {chat.last_message || "เริ่มการสนทนาได้เลย"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`w-full md:w-2/3 flex flex-col bg-[#f0f2f5] relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-4 bg-white border-b border-gray-200 flex items-center shadow-sm z-10 shrink-0">
                            {/* Mobile Back Button */}
                            <button onClick={() => setActiveChat(null)} className="md:hidden mr-3 p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            
                            <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                                <img src={activeChat.product_image ? getFullImageUrl(activeChat.product_image) : 'https://via.placeholder.com/50'} alt="product" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{activeChat.buyer_id === user.id ? activeChat.seller_name : activeChat.buyer_name}</h3>
                                    <p className="text-xs text-gray-500 truncate flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 inline-block"></span>
                                        พูดคุยเกี่ยวกับ: <span className="text-primary font-medium ml-1">{activeChat.product_name}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-bg">
                            {messages.length === 0 && (
                                <div className="flex justify-center my-6">
                                    <span className="bg-black/10 text-gray-600 text-xs py-1 px-3 rounded-full font-medium">เริ่มต้นการสนทนาเลย</span>
                                </div>
                            )}

                            {messages.map((msg, index) => {
                                const isMe = msg.sender_id === user.id;
                                const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id === user.id);
                                
                                return (
                                    <div key={msg.id} className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 mr-2 shrink-0 mb-5">
                                                {showAvatar && activeChat.buyer_id !== user.id && activeChat.buyer_image && <img src={getFullImageUrl(activeChat.buyer_image)} alt="Avatar" className="w-full h-full object-cover" />}
                                                {showAvatar && activeChat.seller_id !== user.id && activeChat.seller_image && <img src={getFullImageUrl(activeChat.seller_image)} alt="Avatar" className="w-full h-full object-cover" />}
                                            </div>
                                        )}
                                        
                                        <div className={`relative max-w-[70%] lg:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-2.5 shadow-sm text-[15px] leading-relaxed break-words ${isMe ? 'bg-primary text-white rounded-2xl rounded-tr-sm' : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'}`}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 mx-1">
                                                {new Date(msg.created_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} 
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} className="h-4" /> {/* Spacer */}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                            <form onSubmit={sendMessage} className="flex items-center space-x-3">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="พิมพ์ข้อความของคุณที่นี่..." 
                                    className="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 focus:ring-2 focus:ring-primary/50 text-[15px] transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!newMessage.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark hover:scale-105 shadow-md'}`}
                                >
                                    <FiSend size={20} className={newMessage.trim() ? 'ml-1' : ''} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                        <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                            <FiMessageSquare size={56} className="text-primary/40" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-600 mb-2">ข้อความส่วนตัว</h3>
                        <p className="text-gray-500 max-w-xs text-center">เลือกรายชื่อการสนทนาทางด้านซ้ายเพื่อเปิดอ่านหรือตอบกลับข้อความ</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Chats;
