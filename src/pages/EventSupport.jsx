import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Send, User, Clock, FileText, MessageSquare, Image as ImageIcon, X, Mic, Square, Trash2, Sparkles } from 'lucide-react';
import VoiceNotePlayer from '../components/VoiceNotePlayer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

import { API_URL as API } from '../services/api';

const EventSupport = () => {
  const { taskId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const chatInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatMessagesEndRef = useRef(null);
  const [task, setTask] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(null);

  const {
    isRecording,
    recordingTime,
    audioBase64,
    recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording
  } = useAudioRecorder();

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    // Prevent any horizontal scroll on mount
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });

    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/volunteer/tasks/${taskId}`, { headers });
        setTask(data);
        setEvent(data.event);
        setChatMessages(data.chatMessages || []);
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  // Live polling for chat messages every 2 seconds without page refresh
  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/volunteer/tasks/${taskId}`, { headers });
        const newMsgs = data?.chatMessages || [];
        setChatMessages((prevMsgs) => {
          if (
            newMsgs.length !== prevMsgs.length ||
            (newMsgs.length > 0 &&
              prevMsgs.length > 0 &&
              newMsgs[newMsgs.length - 1]?.timestamp !== prevMsgs[prevMsgs.length - 1]?.timestamp)
          ) {
            setTimeout(() => {
              if (chatMessagesEndRef.current) {
                chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
            return newMsgs;
          }
          return prevMsgs;
        });
      } catch (error) {
        // Silent catch for background polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId, token]);

  // Auto-scroll to chat and focus input when coming from notification
  useEffect(() => {
    if (location.state?.fromNotification) {
      setTimeout(() => {
        // Scroll to the chat section cleanly without horizontal drift
        const chatSection = document.getElementById('chat-section');
        if (chatSection) {
          chatSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
          // Add a temporary highlight effect
          chatSection.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => {
            chatSection.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
        }
        // Focus the input safely without viewport jump
        if (chatInputRef.current) {
          chatInputRef.current.focus({ preventScroll: true });
        }
      }, 500);
    }
  }, [location.state]);

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = message.trim();
    const imageToSend = selectedImage;
    const audioToSend = audioBase64;
    if (!textToSend && !imageToSend && !audioToSend) return;

    // Immediately clear inputs so the type box is emptied instantly!
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    clearRecording();
    setSendingMessage(true);

    const newMessage = {
      sender: user._id,
      senderName: user.fullName || user.username,
      senderRole: user.role,
      text: textToSend,
      image: imageToSend || '',
      audio: audioToSend || '',
      timestamp: new Date().toISOString()
    };

    // Optimistically show message bubble immediately!
    setChatMessages((prev) => [...prev, newMessage]);
    setTimeout(() => {
      if (chatMessagesEndRef.current) {
        chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);

    try {
      const { data } = await axios.post(
        `${API}/volunteer/tasks/${taskId}/chat`,
        { message: newMessage },
        { headers }
      );

      if (data?.chatMessages) {
        setChatMessages(data.chatMessages);
      }
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        if (chatMessagesEndRef.current) {
          chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(textToSend);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendQuickMessage = async (quickText) => {
    if (!quickText || !taskId || sendingMessage) return;
    setSendingMessage(true);
    try {
      const newMessage = {
        sender: user?._id || 'volunteer',
        senderName: user?.fullName || user?.username || 'Volunteer',
        senderRole: 'volunteer',
        text: quickText,
        image: '',
        audio: '',
        timestamp: new Date().toISOString()
      };

      setChatMessages((prev) => [...prev, newMessage]);
      setTimeout(() => {
        if (chatMessagesEndRef.current) {
          chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);

      const { data } = await axios.post(
        `${API}/volunteer/tasks/${taskId}/chat`,
        { message: newMessage },
        { headers }
      );
      setChatMessages(data.chatMessages || []);
    } catch (error) {
      console.error('Error sending quick message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b52f6]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent w-full max-w-full overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-3.5 sm:px-8 sticky top-0 z-20 w-full shadow-2xs">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <button
            onClick={() => navigate('/volunteer/dashboard')}
            className="flex items-center space-x-1.5 sm:space-x-2 text-gray-700 hover:text-gray-900 transition-colors p-1.5 -ml-1 rounded-lg hover:bg-gray-100/80 active:scale-95 shrink-0"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="font-semibold text-xs sm:text-sm">Back<span className="hidden xs:inline"> to Dashboard</span></span>
          </button>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 ml-2">
          <div className="w-8 h-8 bg-[#eef0ff] text-[#5b52f6] rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border border-indigo-100">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'V'}
          </div>
          <span className="text-gray-800 font-semibold text-xs sm:text-sm max-w-[120px] truncate">{user?.username || 'Volunteer'}</span>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-8 flex-1 min-w-0">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Event Support</h1>
          <p className="text-gray-500 text-xs sm:text-sm lg:text-base">Rules, regulations, and real-time communication for your assigned task</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
          {/* Left Column - Rules and Regulations */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full min-w-0">
            {/* Task Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 w-full min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 break-words">{task?.taskName}</h2>
                  <p className="text-gray-600 text-xs sm:text-sm break-words">{task?.description}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold shrink-0 ${
                  task?.status === 'completed' ? 'bg-teal-50 text-teal-700' :
                  task?.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {task?.status === 'completed' ? 'Completed' : task?.status === 'in-progress' ? 'In progress' : 'Pending'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 text-xs sm:text-sm text-gray-500 pt-2 border-t border-gray-50">
                <div className="flex items-center space-x-1.5 shrink-0">
                  <Clock size={15} className="text-gray-400 shrink-0" />
                  <span>Due: {task?.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <User size={15} className="text-[#5b52f6] shrink-0" />
                  <span className="text-[#5b52f6] font-semibold truncate">Event: {event?.title || '—'}</span>
                </div>
              </div>
            </div>

            {/* Rules and Regulations */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 w-full min-w-0">
              <div className="flex items-center space-x-2.5 mb-3 sm:mb-4">
                <FileText size={20} className="text-[#5b52f6] sm:w-6 sm:h-6 shrink-0" />
                <h3 className="text-base sm:text-xl font-bold text-gray-900">Rules and Regulations</h3>
              </div>
              
              {event?.rules || task?.rules ? (
                <div className="space-y-4">
                  {event?.rules && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 uppercase tracking-wider">
                        Event Rules ({event.title})
                      </h4>
                      <div className="p-3 sm:p-4 bg-gray-50 rounded-xl text-xs sm:text-sm text-gray-700 whitespace-pre-line break-words">
                        {event.rules}
                      </div>
                    </div>
                  )}
                  
                  {task?.rules && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 uppercase tracking-wider">
                        Task Instructions ({task.taskName})
                      </h4>
                      <div className="p-3 sm:p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs sm:text-sm text-blue-800 whitespace-pre-line break-words">
                        {task.rules}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4 text-xs sm:text-sm">No specific rules or instructions provided for this task.</p>
              )}
            </div>
          </div>

          {/* Right Column - Chat Box */}
          <div className="lg:col-span-1 w-full min-w-0">
            <div id="chat-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[520px] sm:h-[600px] flex flex-col w-full min-w-0 overflow-hidden">
              <div className="p-3.5 sm:p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <MessageSquare size={20} className="text-[#5b52f6] shrink-0" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Live Coordinator Chat</h3>
                    <p className="text-[11px] sm:text-xs text-gray-400">Direct message with event admins</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0 min-w-0" ref={chatContainerRef}>
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs sm:text-sm font-medium">No messages yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Send a message below to start chatting with the event coordinator</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isAdminMessage = msg.senderRole === 'admin';
                    return (
                      <div
                        key={index}
                        className={`flex ${isAdminMessage ? 'justify-start' : 'justify-end'} w-full min-w-0`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-2xs break-words ${
                            isAdminMessage
                              ? 'bg-teal-600 text-white rounded-tl-xs'
                              : 'bg-[#5b52f6] text-white rounded-tr-xs'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 mb-1 opacity-90">
                            <span className="text-[11px] sm:text-xs font-semibold">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] sm:text-[11px] opacity-75">
                              {msg.senderRole === 'admin' ? '(Admin)' : '(Volunteer)'}
                            </span>
                          </div>
                          {msg.image && (
                            <div className="mb-2">
                              <img 
                                src={msg.image} 
                                alt="Shared image" 
                                className="max-w-full h-auto rounded-lg cursor-pointer max-h-[180px] object-cover"
                                onClick={() => setShowImagePreview(msg.image)}
                              />
                            </div>
                          )}
                          {msg.audio && (
                            <div className="mb-2 max-w-full overflow-hidden">
                              <VoiceNotePlayer 
                                src={msg.audio} 
                                variant={isAdminMessage ? 'admin' : 'volunteer'} 
                              />
                            </div>
                          )}
                          {msg.text && <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}
                          <p className="text-[10px] opacity-70 mt-1 text-right">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-2.5 sm:p-3.5 border-t border-gray-100 bg-white min-w-0">
                {/* Quick Replies Bar */}
                <div 
                  className="mb-2.5 pb-2 border-b border-gray-50 flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0 mr-1 flex items-center gap-1">
                    <Sparkles size={11} className="text-indigo-500" /> Quick Replies:
                  </span>
                  {[
                    'On my way! 🏃',
                    'Arrived at venue 📍',
                    'Task completed! ✅',
                    'Photo uploaded 📸',
                    'Need assistance 🙋',
                    'Got it, thanks! 👍'
                  ].map((quickText) => (
                    <button
                      key={quickText}
                      type="button"
                      disabled={sendingMessage}
                      onClick={() => handleSendQuickMessage(quickText)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 text-xs font-medium rounded-lg border border-gray-200/80 shadow-2xs transition-all whitespace-nowrap active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {quickText}
                    </button>
                  ))}
                </div>

                {/* Voice Note Preview */}
                {audioBase64 && (
                  <div className="mb-2.5 p-2 bg-indigo-50/90 border border-indigo-100 rounded-xl flex items-center justify-between gap-2 animate-fade-in min-w-0">
                    <div className="flex items-center gap-1.5 overflow-hidden min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1 shrink-0">
                        <Mic size={13} /> Voice:
                      </span>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <VoiceNotePlayer src={audioBase64} variant="light" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearRecording}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Discard voice note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                {/* Recorder Error message */}
                {recorderError && (
                  <div className="mb-2.5 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center justify-between">
                    <span>{recorderError}</span>
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-2.5 relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                
                {isRecording ? (
                  <div className="flex items-center space-x-2 w-full bg-red-50/90 border border-red-200 rounded-xl px-2.5 py-1.5 animate-fade-in min-w-0">
                    <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                      </span>
                      <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider shrink-0">
                        Rec
                      </span>
                      <span className="text-xs font-mono font-semibold text-gray-700 bg-white/90 px-1.5 py-0.5 rounded border border-red-100 shrink-0">
                        {Math.floor(recordingTime / 60)}:{recordingTime % 60 < 10 ? '0' : ''}{recordingTime % 60}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Discard recording"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-2.5 py-1 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                      title="Stop recording"
                    >
                      <Square size={12} className="fill-current" /> Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 sm:space-x-2 w-full min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                      title="Attach image"
                    >
                      <ImageIcon size={18} />
                    </label>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                      title="Record voice note"
                    >
                      <Mic size={18} />
                    </button>
                    <input
                      ref={chatInputRef}
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-xs sm:text-sm bg-gray-50/50 focus:bg-white transition-colors"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={(!message.trim() && !selectedImage && !audioBase64) || sendingMessage}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-[#5b52f6] text-white rounded-xl hover:bg-[#4a42d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center shadow-xs active:scale-95"
                      title="Send message"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImagePreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
            <img 
              src={showImagePreview} 
              alt="Full size preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSupport;
