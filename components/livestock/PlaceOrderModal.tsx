'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebaseConfig'
import { collection, addDoc, serverTimestamp, doc, onSnapshot, getDocs } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { XMarkIcon, ChatBubbleLeftRightIcon, UserIcon, PhoneIcon, MapPinIcon, EnvelopeIcon, ExclamationCircleIcon, ScaleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  animalDetails: string; 
  price: number; 
}

export default function PlaceOrderModal({ isOpen, onClose, animalDetails, price }: ModalProps) {
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(false)
  const [enquiryPhone, setEnquiryPhone] = useState('')
  const [availableStock, setAvailableStock] = useState<number | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    address: '',
    quantity: '1',
    weight: '1' // ✅ NEW: Weight field (kg)
  })

  const extractCategory = (fullName: string): string => {
    if (!fullName) return "";
    return fullName.split('(')[0].trim();
  };

  const categoryName = extractCategory(animalDetails);
  const pricePerKg = price || 0;
  const requestedQty = parseInt(formData.quantity) || 0;
  const requestedKg = parseFloat(formData.weight) || 0;

  // ✅ NEW LOGIC: Total = (Price * KG) * Quantity
  const totalAmount = (pricePerKg * requestedKg) * requestedQty;

  const isOutOfStock = availableStock !== null && (availableStock <= 0 || requestedQty > availableStock);

  useEffect(() => {
    if (!isOpen) {
      setAvailableStock(null);
      setFormData(prev => ({ ...prev, quantity: '1', weight: '1' }));
      return;
    }

    const unsubContact = onSnapshot(doc(db, "settings", "contact"), (docSnap) => {
      if (docSnap.exists()) setEnquiryPhone(docSnap.data().phoneNumber || '')
    });

    const unsubStock = onSnapshot(collection(db, "livestockCategories"), (snapshot) => {
      const allStock = snapshot.docs.map(d => ({ 
        id: d.id,
        name: d.data().name, 
        stockQty: Number(d.data().stockQty) || 0 
      }));

      const match = allStock.find(item => item.name.toLowerCase() === categoryName.toLowerCase());
      setAvailableStock(match ? match.stockQty : 0);
    });

    return () => { unsubContact(); unsubStock(); };
  }, [isOpen, categoryName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please login first");
    if (isOutOfStock) return toast.error(`Insufficient stock for ${categoryName}`);
    
    setLoading(true);
    const tId = toast.loading("Processing order...");

    try {
      const categoriesSnap = await getDocs(collection(db, "livestockCategories"));
      const categoryDoc = categoriesSnap.docs.find(doc => doc.data().name.toLowerCase() === categoryName.toLowerCase());

      if (!categoryDoc || categoryDoc.data().stockQty < requestedQty) {
        toast.error("Stock changed. Please try again.", { id: tId });
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "customersOrders"), {
        userId: user.uid,
        customerName: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        quantity: requestedQty,
        weightPerUnit: requestedKg, // ✅ Stored weight
        totalAmount: totalAmount, 
        orderDetails: animalDetails,
        category: categoryName,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const message = `*NEW ORDER ENQUIRY*

      *Animal:* ${animalDetails}
      *Category:* ${categoryName}
      *Weight:* ${requestedKg}kg per unit
      *Quantity:* ${requestedQty}
      *Total Amount:* ₦${totalAmount.toLocaleString()}

      *Customer Details:*
      - Name: ${formData.name}
      - Phone: ${formData.phone}
      - Address: ${formData.address}`;

// Encode the message for WhatsApp URL
const encodedMessage = encodeURIComponent(message);

toast.success("Order recorded!", { id: tId });
window.open(`https://wa.me/${enquiryPhone}?text=${encodedMessage}`, '_blank');
onClose();
      toast.success("Order recorded!", { id: tId });
      window.open(`https://wa.me/${enquiryPhone}?text=${message}`, '_blank');
      onClose();
    } catch (err) {
      toast.error("Failed to process order", { id: tId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 font-sans">
      <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-emerald-100">
        
        {/* Stock Status Banner */}
        <div className={`p-3 flex items-center gap-3 ${isOutOfStock ? 'bg-red-600' : 'bg-green-600'} text-white`}>
          <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
          <p className="text-xs font-black uppercase tracking-widest">
            {availableStock === 0 ? 'Out of stock' : isOutOfStock ? `Only ${availableStock} available` : `✓ In Stock: ${availableStock}`}
          </p>
        </div>

        <div className="bg-emerald-600 p-4 py-3 text-white flex justify-between items-center">
            <h2 className="text-xl font-black">Finalize Order</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><XMarkIcon className="w-6 h-6" /></button>
        </div>

        <div className="p-4 py-3">
          {/* Price Summary Card */}
          <div className="bg-emerald-900 p-4 py-3 rounded-lg mb-4 flex justify-between items-center text-white">
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Price Calculation</p>
              <p className="text-xs text-emerald-200">₦{pricePerKg.toLocaleString()} × {requestedKg}kg × {requestedQty} unit(s)</p>
            </div>
            <div className="text-right pl-4 border-l border-emerald-800">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Bill</p>
               <p className="font-black text-lg md:text-xl text-emerald-300">₦{totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <UserIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
              <input required placeholder="Your Full Name" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 text-sm"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <PhoneIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
                <input required type="tel" placeholder="Phone Number" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="relative">
                <EnvelopeIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
                <input required type="email" placeholder="Email Address" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            {/* ✅ NEW: Split Row for KG and QTY */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <ScaleIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
                <input required type="number" step="0.1" min="0.1" placeholder="Weight (kg)" 
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                  value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                <span className="absolute right-3 top-4 text-[10px] font-black text-gray-400 uppercase">KG</span>
              </div>
              <div className="relative">
                <span className="text-[10px] absolute left-4 top-4 font-black text-emerald-600 uppercase">QTY</span>
                <input required type="number" min="1" max={availableStock || undefined}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-lg outline-none ring-1 transition-all font-bold text-sm ${isOutOfStock ? 'bg-red-50 ring-red-500 text-red-600' : 'bg-gray-50 ring-gray-100 focus:ring-emerald-500'}`}
                  value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} 
                />
              </div>
            </div>

            <div className="relative">
              <MapPinIcon className="w-5 h-5 absolute left-4 top-4 text-emerald-600" />
              <textarea required placeholder="Delivery Address" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-lg outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 h-20 text-sm"
                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <button disabled={loading || isOutOfStock} className={`w-full py-4 font-black rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-emerald-900 text-white hover:bg-black'}`}>
              {loading ? 'Processing...' : isOutOfStock ? 'Insufficient Stock' : (
                <>
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  Place Order (₦{totalAmount.toLocaleString()})
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}