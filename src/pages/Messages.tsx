import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, ArrowLeft, Search, ExternalLink, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at: string | null;
  listing_id: string;
  profiles: {
    username: string;
    avatar_url: string;
    gender: string | null;
  };
  listings: {
    title: string;
    images: string[];
    owner_id: string;
  };
}

interface Conversation {
  userId: string;
  username: string;
  avatar_url: string;
  gender: string | null;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  listingId: string;
  listingTitle: string;
  listingImage: string | null;
}

interface ConversationGroup {
  listingId: string;
  listingTitle: string;
  listingImage: string | null;
  conversations: Record<string, Conversation>;
}

// Default avatar URLs
const defaultAvatarUrl = 'https://ighqyvttbwqivsemrqon.supabase.co/storage/v1/object/public/assets//IMG_0006.PNG';
const maleAvatarUrl = 'https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//Avatar_homme.png';
const femaleAvatarUrl = 'https://rjmndugrzyjjmmzdobwt.supabase.co/storage/v1/object/public/assets//Avatar_femme_2.png';

function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState(location.state?.prewrittenMessage || '');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedListingTitle, setSelectedListingTitle] = useState<string | null>(null);
  const [selectedListingImage, setSelectedListingImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showConversations, setShowConversations] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationGroups, setConversationGroups] = useState<ConversationGroup[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setShowConversations(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
      const unsubscribe = subscribeToMessages();
      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.contactUserId && location.state?.listingId) {
      handleSelectConversation({
        userId: location.state.contactUserId,
        username: location.state.username || '',
        avatar_url: '',
        gender: null,
        lastMessage: '',
        lastMessageDate: new Date().toISOString(),
        unreadCount: 0,
        listingId: location.state.listingId,
        listingTitle: location.state.listingTitle || '',
        listingImage: null
      });
      setShowConversations(false);
      
      if (location.state?.prewrittenMessage) {
        setNewMessage(location.state.prewrittenMessage);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedUserId && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedUserId]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          created_at,
          read_at,
          listing_id,
          profiles!messages_sender_id_fkey (
            username,
            avatar_url,
            gender
          ),
          listings (
            title,
            images,
            owner_id
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!messages) {
        setConversationGroups([]);
        return;
      }

      const groupedMessages = messages.reduce<Record<string, ConversationGroup>>((groups, message) => {
        if (!message.listing_id || !message.listings) return groups;

        const listingId = message.listing_id;
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        
        if (!groups[listingId]) {
          groups[listingId] = {
            listingId,
            listingTitle: message.listings.title,
            listingImage: message.listings.images?.[0] || null,
            conversations: {}
          };
        }
        
        if (!groups[listingId].conversations[otherUserId]) {
          groups[listingId].conversations[otherUserId] = {
            userId: otherUserId,
            username: message.profiles.username,
            avatar_url: message.profiles.avatar_url,
            gender: message.profiles.gender,
            lastMessage: message.content,
            lastMessageDate: message.created_at,
            unreadCount: message.receiver_id === user.id && !message.read_at ? 1 : 0,
            listingId: message.listing_id,
            listingTitle: message.listings.title,
            listingImage: message.listings.images?.[0] || null
          };
        } else {
          if (message.receiver_id === user.id && !message.read_at) {
            groups[listingId].conversations[otherUserId].unreadCount++;
          }
          
          const currentLastDate = new Date(groups[listingId].conversations[otherUserId].lastMessageDate);
          const messageDate = new Date(message.created_at);
          if (messageDate > currentLastDate) {
            groups[listingId].conversations[otherUserId].lastMessage = message.content;
            groups[listingId].conversations[otherUserId].lastMessageDate = message.created_at;
          }
        }

        return groups;
      }, {});

      const conversationGroups = Object.values(groupedMessages).map(group => ({
        ...group,
        conversations: Object.values(group.conversations).sort((a, b) => 
          new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
        )
      }));

      conversationGroups.sort((a, b) => {
        const aLatest = a.conversations[0]?.lastMessageDate || '';
        const bLatest = b.conversations[0]?.lastMessageDate || '';
        return new Date(bLatest).getTime() - new Date(aLatest).getTime();
      });

      setConversationGroups(conversationGroups);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user!.id}`
        },
        () => {
          fetchConversations();
          if (selectedUserId && selectedListingId) {
            fetchMessages(selectedUserId, selectedListingId);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchMessages = async (userId: string, listingId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey (
            username,
            avatar_url,
            gender
          ),
          listings (
            title,
            images,
            owner_id
          )
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
      
      const unreadMessages = data?.filter(
        message => message.receiver_id === user.id && !message.read_at
      );

      if (unreadMessages?.length) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in(
            'id',
            unreadMessages.map(message => message.id)
          );

        setConversationGroups(prev =>
          prev.map(group => ({
            ...group,
            conversations: group.conversations.map(conv =>
              conv.userId === userId ? { ...conv, unreadCount: 0 } : conv
            )
          }))
        );
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('Erreur lors du chargement des messages');
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedUserId(conversation.userId);
    setSelectedListingId(conversation.listingId);
    setSelectedListingTitle(conversation.listingTitle);
    setSelectedListingImage(conversation.listingImage);
    fetchMessages(conversation.userId, conversation.listingId);
    if (isMobileView) {
      setShowConversations(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !selectedListingId || !user) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.from('messages').insert({
        content: newMessage.trim(),
        sender_id: user.id,
        receiver_id: selectedUserId,
        listing_id: selectedListingId
      });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages(selectedUserId, selectedListingId);
      await fetchConversations();

      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_id === user?.id) {
      return message.read_at ? 'Lu' : 'Envoyé';
    }
    return null;
  };

  const getBookingLink = (message: Message) => {
    if (!message.listings?.owner_id) return null;

    const isOwner = message.listings.owner_id === user?.id;
    const isSender = message.sender_id === user?.id;

    // If user is the owner, always go to received bookings
    if (isOwner) {
      return '/bookings/received';
    }
    
    // If user is the renter, go to sent bookings
    if (!isOwner) {
      return '/bookings/sent';
    }

    return null;
  };

  // Function to get the appropriate avatar URL
  const getAvatarUrl = (profile: { avatar_url?: string, gender?: string | null } | null, username?: string) => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    } else if (profile?.gender === 'male') {
      return maleAvatarUrl;
    } else if (profile?.gender === 'female') {
      return femaleAvatarUrl;
    } else {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${username || 'User'}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col pt-16">
      <div className="flex-grow flex flex-col h-full">
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
          <div className="flex-grow flex flex-col h-full">
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex-grow flex flex-col h-full">
              <div className="flex h-full">
                <div 
                  className={`w-full md:w-80 border-r border-gray-200 ${
                    isMobileView && !showConversations ? 'hidden' : 'flex flex-col'
                  }`}
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher une conversation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : conversationGroups.length === 0 ? (
                      <div className="text-center p-4 text-gray-500">
                        Aucune conversation
                      </div>
                    ) : (
                      conversationGroups.map((group) => (
                        <div key={group.listingId} className="border-b border-gray-100 last:border-b-0">
                          <div className="p-4 bg-gray-50">
                            <div className="flex items-center">
                              <div className="relative w-12 h-12 rounded-md overflow-hidden mr-3 flex-shrink-0">
                                <img
                                  src={group.listingImage || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'}
                                  alt={group.listingTitle}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link 
                                  to={`/listing/${group.listingId}`}
                                  className="text-sm font-medium hover:text-primary line-clamp-2"
                                >
                                  {group.listingTitle}
                                </Link>
                              </div>
                            </div>
                          </div>
                          {group.conversations.map((conversation) => (
                            <button
                              key={conversation.userId}
                              onClick={() => handleSelectConversation(conversation)}
                              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                                selectedUserId === conversation.userId &&
                                selectedListingId === conversation.listingId
                                  ? 'bg-primary/5'
                                  : ''
                              }`}
                            >
                              <div className="flex items-start mb-1">
                                <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                  <img
                                    src={getAvatarUrl(
                                      { 
                                        avatar_url: conversation.avatar_url, 
                                        gender: conversation.gender 
                                      }, 
                                      conversation.username
                                    )}
                                    alt={conversation.username}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <Link 
                                      to={`/user-profile/${conversation.userId}`}
                                      className="font-medium hover:text-primary"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {conversation.username}
                                    </Link>
                                    <span className="text-xs text-gray-500">
                                      {formatMessageDate(conversation.lastMessageDate)}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 line-clamp-2">
                                    {conversation.lastMessage}
                                  </div>
                                  {conversation.unreadCount > 0 && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary bg-primary/10 rounded-full">
                                        {conversation.unreadCount} nouveau{conversation.unreadCount > 1 ? 'x' : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div 
                  className={`flex-1 flex flex-col h-full ${
                    isMobileView && showConversations ? 'hidden' : ''
                  }`}
                >
                  {selectedUserId ? (
                    <>
                      <div className="p-4 border-b border-gray-200 flex items-center">
                        {isMobileView && (
                          <button
                            onClick={() => setShowConversations(true)}
                            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">
                            {selectedListingTitle}
                          </div>
                          <div className="flex items-center space-x-4">
                            <Link
                              to={`/listing/${selectedListingId}`}
                              className="text-sm text-primary hover:text-primary-dark flex items-center"
                            >
                              Voir l'annonce
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </Link>
                            <Link
                              to={`/user-profile/${selectedUserId}`}
                              className="text-sm text-primary hover:text-primary-dark flex items-center"
                            >
                              Voir le profil
                              <User className="w-4 h-4 ml-1" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] ${
                                message.sender_id === user?.id
                                  ? 'bg-primary text-white rounded-l-lg rounded-tr-lg'
                                  : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
                              } p-3`}
                            >
                              <div className="text-xs font-medium mb-1">
                                {message.sender_id === user?.id ? (
                                  'Moi'
                                ) : (
                                  <Link
                                    to={`/user-profile/${message.sender_id}`}
                                    className={`hover:underline ${
                                      message.sender_id === user?.id ? 'text-white' : 'text-primary'
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {message.profiles.username}
                                  </Link>
                                )}
                              </div>
                              <div className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </div>
                              <div
                                className={`text-xs mt-1 ${
                                  message.sender_id === user?.id
                                    ? 'text-primary-light'
                                    : 'text-gray-500'
                                }`}
                              >
                                {formatMessageDate(message.created_at)}
                                {getMessageStatus(message) && (
                                  <span className="ml-2">{getMessageStatus(message)}</span>
                                )}
                                {getBookingLink(message) && (
                                  <Link
                                    to={getBookingLink(message)!}
                                    className={`ml-2 hover:underline ${
                                      message.sender_id === user?.id ? 'text-white' : 'text-primary'
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Voir la réservation
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      <div className="p-4 border-t border-gray-200">
                        <div className="flex items-end space-x-4">
                          <div className="flex-1">
                            <textarea
                              ref={textareaRef}
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={handleKeyPress}
                              placeholder="Écrivez votre message..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                              rows={1}
                            />
                          </div>
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            className="flex-shrink-0 p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingMessage ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      Sélectionnez une conversation pour commencer
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;