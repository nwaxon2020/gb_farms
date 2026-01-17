'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebaseConfig'
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { XMarkIcon, ChatBubbleLeftRightIcon, UserIcon, PhoneIcon, MapPinIcon, EnvelopeIcon, HashtagIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  animalDetails: string;
}

export default function PlaceOrderModal({ isOpen, onClose, animalDetails }: ModalProps) {
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(false)
  const [enquiryPhone, setEnquiryPhone] = useState('')
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    address: '',
    quantity: '1' 
  })

  // ✅ Extract price from string (Assumes format contains "₦" or digits)
  const unitPrice = parseInt(animalDetails.replace(/[^0-9]/g, '')) || 0;
  const totalAmount = unitPrice * (parseInt(formData.quantity) || 0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contact"), (doc) => {
      if (doc.exists()) {
        setEnquiryPhone(doc.data().phoneNumber || '')
      }
    })
    return () => unsub()
  }, [])

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please login first");
    if (!enquiryPhone) return toast.error("Admin contact not set. Please try again later.");
    
    setLoading(true);
    const tId = toast.loading("Processing your order...");

    try {
      await addDoc(collection(db, "customersOrders"), {
        userId: user.uid,
        customerName: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        quantity: formData.quantity,
        totalAmount: totalAmount, // ✅ Saved to DB
        orderDetails: animalDetails,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const message = `*NEW ORDER ENQUIRY*%0A%0A*Animal:* ${animalDetails}%0A*Quantity:* ${formData.quantity}%0A*Total Amount:* ₦${totalAmount.toLocaleString()}%0A%0A*Customer Details:*%0A- Name: ${formData.name}%0A- Phone: ${formData.phone}%0A- Email: ${formData.email}%0A- Address: ${formData.address}`;
      
      toast.success("Order recorded! Opening WhatsApp...", { id: tId });
      window.open(`https://wa.me/${enquiryPhone}?text=${message}`, '_blank');
      onClose();
    } catch (err) {
      toast.error("Failed to process order", { id: tId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-emerald-600 p-4 md:px-4 md:py-2 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-black">Finalize Order</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
          <p className="text-emerald-100 text-sm">Review your total and proceed to WhatsApp.</p>
        </div>

        <div className="p-4 ">
          {/* ✅ UPDATED SUMMARY BOX WITH TOTAL */}
          <div className="bg-emerald-900 p-4 md:py-2 md:px-4 md:px-5 rounded-lg mb-4 shadow-inner flex justify-between items-center text-white">
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Item Details</p>
              <p className="font-bold text-xs md:text-sm line-clamp-1">{animalDetails}</p>
            </div>
            <div className="text-right pl-4 border-l border-emerald-800">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Bill</p>
               <p className="font-black text-base md:text-xl text-emerald-300">₦{totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <UserIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
              <input required placeholder="Your Full Name" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 transition-all text-sm md:text-base"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <PhoneIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
                <input required type="tel" placeholder="Phone Number" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 transition-all text-sm md:text-base"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="relative">
                <span className="text-sm w-5 h-5 absolute left-4 top-4 text-emerald-600">Qty</span>
                <input required type="number" min="1" placeholder="Quantity" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-sm md:text-base"
                  value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </div>
            </div>

            <div className="relative">
                <EnvelopeIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
                <input required type="email" placeholder="Email Address" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 transition-all text-sm md:text-base"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            
            <div className="relative">
              <MapPinIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
              <textarea required placeholder="Delivery Address" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 transition-all h-20 md:h-24 text-sm md:text-base"
                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <button disabled={loading || !enquiryPhone} className="w-full py-4 bg-emerald-900 text-white font-black rounded-xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
              {loading ? 'Processing Order...' : (
                <>
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  Place Order via WhatsApp
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}