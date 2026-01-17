'use client'
import { useState, useEffect, useRef } from 'react'
import { db, auth } from '@/lib/firebaseConfig'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment, where, getDocs } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, LockClosedIcon, ChevronLeftIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ChatInterface = () => {
  const [user] = useAuthState(auth)
  const [chats, setChats] = useState<any[]>([]) 
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [adminsOnline, setAdminsOnline] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // ✅ Role Verification: CEO (Any method) or Staff (Password only)
  useEffect(() => {
    const verifyStaff = async () => {
      if (user?.email) {
        const CEO_ID = process.env.NEXT_PUBLIC_ADMIN_ID;
        const isPasswordUser = user.providerData.some(p => p.providerId === 'password');

        // Master CEO bypasses provider check, Staff MUST use password
        if (user.uid === CEO_ID || isPasswordUser) {
          const q = query(collection(db, "adminStaff"), where("email", "==", user.email.toLowerCase()))
          const snap = await getDocs(q)
          setIsAdmin(!snap.empty || user.uid === CEO_ID)
        } else {
          setIsAdmin(false)
        }
      }
    }
    verifyStaff()
  }, [user])

  const isCustomer = user && !isAdmin;

  // Monitor Admin Online Status
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "adminStaff"), (snap) => {
      setAdminsOnline(snap.docs.length > 0)
    })
    return () => unsub()
  }, [])

  // Admin: Load all chat cards
  useEffect(() => {
    if (!isAdmin) return
    const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"))
    return onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [isAdmin])

  // Load Messages for active chat
  useEffect(() => {
    const targetId = isCustomer ? user?.uid : activeChatId
    if (!targetId) return

    const q = query(collection(db, "chats", targetId, "messages"), orderBy("createdAt", "asc"))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // Reset unread count if Admin opens the chat
    if (isAdmin && activeChatId) {
       updateDoc(doc(db, "chats", activeChatId), { unreadCount: 0 })
    }
    return () => unsub()
  }, [activeChatId, user, isCustomer, isAdmin])

  const handleSelectChat = (id: string | null) => {
    setActiveChatId(id)
    setIsMobileChatOpen(true)
  }

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Sign in error", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return
    const targetChatId = isCustomer ? user.uid : activeChatId
    if (!targetChatId) return

    const msgData = {
      text: newMessage, 
      senderId: user.uid, 
      senderEmail: user.email,
      isAdmin: isAdmin, 
      createdAt: serverTimestamp()
    }

    try {
      await addDoc(collection(db, "chats", targetChatId, "messages"), msgData)
      await setDoc(doc(db, "chats", targetChatId), {
        lastMessage: newMessage,
        userName: isCustomer ? user.displayName : (chats.find(c => c.id === activeChatId)?.userName || chats.find(c => c.id === activeChatId)?.userEmail),
        userEmail: isCustomer ? user.email : chats.find(c => c.id === activeChatId)?.userEmail,
        updatedAt: serverTimestamp(),
        unreadCount: isAdmin ? 0 : increment(1)
      }, { merge: true })
      setNewMessage('')
    } catch (err) {
      toast.error("Message failed to send")
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-950 rounded-3xl h-[600px] md:h-[500px] shadow-2xl border border-emerald-900/30">
        <LockClosedIcon className="w-16 h-16 text-emerald-500/20 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2 text-glow">Join the Chat</h3>
        <p className="text-gray-400 mb-8 text-sm max-w-xs">Sign in with Google to start a real-time conversation.</p>
        <button onClick={handleSignIn} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-95">
           <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" /> Continue with Google
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-[600px] md:h-[500px] bg-gray-950 rounded-3xl shadow-2xl border border-emerald-900/30 overflow-hidden relative font-sans">
      
      {/* Sidebar (List of Chats for Admin, "Farm Support" for Customer) */}
      <div className={`${isMobileChatOpen ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-emerald-900/20 bg-black/40 flex-col`}>
        <div className="p-5 bg-emerald-950/50 border-b border-emerald-900/20 flex items-center justify-between">
          <span className="font-black text-[10px] text-emerald-500 uppercase tracking-widest">
            {isAdmin ? "User Conversations" : "Support Dashboard"}
          </span>
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-emerald-500/50" />
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isAdmin && chats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center opacity-40">
              <ChatBubbleOvalLeftEllipsisIcon className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="text-[10px] text-emerald-300 font-black uppercase">No inquiries yet</p>
            </div>
          )}

          {isCustomer ? (
            <div 
              onClick={() => handleSelectChat(user.uid)}
              className="p-1.5 flex items-center gap-3 bg-emerald-900/20 hover:bg-emerald-900/30 transition-all rounded-2xl cursor-pointer border border-emerald-800/30 shadow-inner"
            >
               <div className="relative">
                 <div className="w-9 h-9 bg-emerald-700 rounded-lg flex items-center justify-center text-white font-black shadow-lg">F</div>
                 <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${adminsOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-500'}`} />
               </div>
               <div>
                 <p className="font-bold text-sm text-white">Farm Support</p>
                 <p className="text-[10px] text-emerald-500/70 font-bold uppercase">{adminsOnline ? 'Online' : 'Offline'}</p>
               </div>
            </div>
          ) : (
            chats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => handleSelectChat(chat.id)} 
                className={`p-4 mb-2 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${activeChatId === chat.id ? 'bg-emerald-600/20 border border-emerald-500/30' : 'hover:bg-emerald-900/10 border border-transparent'}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 bg-emerald-800/50 rounded-xl flex items-center justify-center text-emerald-300 font-black uppercase text-sm">
                    {chat.userName?.[0] || chat.userEmail?.[0]}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs text-white truncate">{chat.userName || chat.userEmail}</p>
                    <p className="text-[10px] text-gray-400 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
                {chat.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">{chat.unreadCount}</span>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!isMobileChatOpen ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gradient-to-b from-gray-950 to-black relative`}>
        <div className="p-4 md:p-5 bg-emerald-950/30 border-b border-emerald-900/20 flex items-center gap-3 backdrop-blur-md">
          <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden p-2 -ml-2 text-emerald-500"><ChevronLeftIcon className="w-6 h-6" /></button>
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <h3 className="font-bold text-sm text-white truncate">
             {isAdmin ? (activeChatId ? (chats.find(c => c.id === activeChatId)?.userName || "Active Session") : 'Select a Chat') : 'Farm Support'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleOvalLeftEllipsisIcon className="w-8 h-8 text-emerald-500/30" />
               </div>
               <h4 className="text-white/60 font-bold text-sm mb-1">No Messages Yet</h4>
               <p className="text-[10px] text-emerald-500/40 uppercase font-black tracking-widest">Start the conversation below</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId === user.uid;
              const alignRight = isAdmin ? msg.isAdmin : isMe;

              return (
                <div key={i} className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl text-sm font-medium leading-relaxed ${alignRight ? 'bg-emerald-600 text-white rounded-tr-none shadow-xl shadow-emerald-900/20' : 'bg-emerald-900/20 text-emerald-50 border border-emerald-800/30 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                  
                  {isAdmin && msg.isAdmin && (
                    <span className="text-[8px] font-black mt-1.5 text-emerald-500/60 uppercase tracking-tighter">
                      {isMe ? "You" : `Admin: ${msg.senderEmail}`}
                    </span>
                  )}
                  
                  {isCustomer && msg.isAdmin && (
                    <span className="text-[8px] font-black mt-1.5 text-emerald-400 uppercase tracking-tighter">Farm Admin</span>
                  )}
                  {isCustomer && isMe && (
                    <span className="text-[8px] font-black mt-1.5 text-emerald-500/60 uppercase tracking-tighter">You</span>
                  )}
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 bg-black/40 border-t border-emerald-900/20 flex items-center gap-3 backdrop-blur-xl">
          <input 
            type="text" required
            disabled={isAdmin && !activeChatId}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAdmin && !activeChatId ? "Select a user to reply..." : "Write a message..."}
            className="flex-1 bg-emerald-950/30 p-3.5 rounded-xl outline-none border border-emerald-900/40 text-emerald-50 text-sm focus:border-emerald-500 transition-all placeholder:text-emerald-900/50"
          />
          <button 
            type="submit" 
            disabled={isAdmin && !activeChatId}
            className="p-3.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 active:scale-90 disabled:opacity-20"
          >
            <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
          </button>
        </form>
      </div>
      
      <style jsx global>{`
        .text-glow {
          text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}

export default ChatInterface