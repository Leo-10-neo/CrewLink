import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Send, User, Clock, FileText, MessageSquare, Image as ImageIcon, X, Mic, Square, Trash2 } from 'lucide-react';
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

  // Auto-scroll to chat and focus input when coming from notification
  useEffect(() => {
    if (location.state?.fromNotification) {
      setTimeout(() => {
        // Scroll to the chat section
        const chatSection = document.getElementById('chat-section');
        if (chatSection) {
          chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a temporary highlight effect
          chatSection.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => {
            chatSection.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
        }
        // Focus the input
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }, 500);
    }
  }, [location.state]);

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage && !audioBase64) return;

    setSendingMessage(true);
    try {
      const newMessage = {
        sender: user._id,
        senderName: user.fullName || user.username,
        senderRole: user.role,
        text: message || '',
        image: selectedImage || '',
        audio: audioBase64 || '',
        timestamp: new Date().toISOString()
      };

      const { data } = await axios.post(
        `${API}/volunteer/tasks/${taskId}/chat`,
        { message: newMessage },
        { headers }
      );

      setChatMessages(data.chatMessages || []);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      clearRecording();
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        if (chatMessagesEndRef.current) {
          chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
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
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/volunteer/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#eef0ff] text-[#5b52f6] rounded-full flex items-center justify-center font-bold text-sm">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'V'}
          </div>
          <span className="text-gray-700 font-medium text-sm">{user?.username || 'Volunteer'}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-1">Event Support</h1>
          <p className="text-gray-500 text-lg">Rules, regulations, and communication for your assigned task</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Rules and Regulations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{task?.taskName}</h2>
                  <p className="text-gray-600">{task?.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  task?.status === 'completed' ? 'bg-teal-50 text-teal-700' :
                  task?.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {task?.status === 'completed' ? 'Completed' : task?.status === 'in-progress' ? 'In progress' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Clock size={16} />
                  <span>Due: {task?.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span className="text-[#5b52f6] font-semibold">Event: {event?.title || '—'}</span>
                </div>
              </div>
            </div>

            {/* Rules and Regulations */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText size={24} className="text-[#5b52f6]" />
                <h3 className="text-xl font-bold text-gray-900">Rules and Regulations</h3>
              </div>
              
              {event?.rules ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                      Event Rules ({event.title})
                    </h4>
                    <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-line">
                      {event.rules}
                    </div>
                  </div>
                  
                  {task?.rules && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                        Task Instructions ({task.taskName})
                      </h4>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 whitespace-pre-line">
                        {task.rules}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">No specific rules or instructions provided for this task.</p>
              )}
            </div>
          </div>

          {/* Right Column - Chat Box */}
          <div className="lg:col-span-1">
            <div id="chat-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[600px] flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <MessageSquare size={24} className="text-[#5b52f6]" />
                  <h3 className="text-lg font-bold text-gray-900">Chat</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Communicate with event coordinators</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatContainerRef}>
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isAdminMessage = msg.senderRole === 'admin';
                    return (
                      <div
                        key={index}
                        className={`flex ${isAdminMessage ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-2 ${
                            isAdminMessage
                              ? 'bg-teal-600 text-white'
                              : 'bg-[#5b52f6] text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-semibold">
                              {msg.senderName}
                            </span>
                            <span className="text-xs opacity-70">
                              {msg.senderRole === 'admin' ? '(Admin)' : '(Volunteer)'}
                            </span>
                          </div>
                          {msg.image && (
                            <div className="mb-2">
                              <img 
                                src={msg.image} 
                                alt="Shared image" 
                                className="max-w-full h-auto rounded-lg cursor-pointer"
                                onClick={() => setShowImagePreview(msg.image)}
                                style={{ maxHeight: '200px' }}
                              />
                            </div>
                          )}
                          {msg.audio && (
                            <div className="mb-2">
                              <VoiceNotePlayer 
                                src={msg.audio} 
                                variant={isAdminMessage ? 'admin' : 'volunteer'} 
                              />
                            </div>
                          )}
                          {msg.text && <p className="text-sm">{msg.text}</p>}
                          <p className="text-xs opacity-70 mt-1 text-right">
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
              <div className="p-4 border-t border-gray-100">
                {/* Voice Note Preview */}
                {audioBase64 && (
                  <div className="mb-3 p-2 bg-indigo-50/90 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xs font-bold text-indigo-700 flex items-center gap-1 shrink-0">
                        <Mic size={14} /> Voice note:
                      </span>
                      <VoiceNotePlayer src={audioBase64} variant="light" />
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
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center justify-between">
                    <span>{recorderError}</span>
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                
                {isRecording ? (
                  <div className="flex items-center space-x-3 w-full bg-red-50/90 border border-red-200 rounded-xl px-3.5 py-2 animate-fade-in">
                    <div className="flex items-center space-x-2.5 flex-1">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                      </span>
                      <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                        Recording
                      </span>
                      <span className="text-xs font-mono font-semibold text-gray-700 bg-white/90 px-2 py-0.5 rounded border border-red-100">
                        {Math.floor(recordingTime / 60)}:{recordingTime % 60 < 10 ? '0' : ''}{recordingTime % 60}
                      </span>
                      <div className="flex items-center space-x-0.5 ml-1">
                        <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse"></span>
                        <span className="w-1 h-5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                        <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '75ms' }}></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                      title="Discard recording"
                    >
                      <Trash2 size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Stop recording"
                    >
                      <Square size={14} className="fill-current" /> Done
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title="Attach image"
                    >
                      <ImageIcon size={18} />
                    </label>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title="Record voice note"
                    >
                      <Mic size={18} />
                    </button>
                    <input
                      ref={chatInputRef}
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={(!message.trim() && !selectedImage && !audioBase64) || sendingMessage}
                      className="px-4 py-2 bg-[#5b52f6] text-white rounded-lg hover:bg-[#4a42d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
                      title="Send message"
                    >
                      <Send size={18} />
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
