'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebaseConfig'
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  setDoc, // ✅ Added setDoc for safer updates
  increment, 
  serverTimestamp
} from 'firebase/firestore'
import { 
  CheckCircleIcon, 
  TrashIcon, 
  ShoppingBagIcon, 
  ArrowLeftIcon,
  PhoneIcon,
  BanknotesIcon,
  HashtagIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [showConfirmDelivery, setShowConfirmDelivery] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const q = query(collection(db, "customersOrders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // ✅ We cast the map result to any[] so TypeScript allows the .status check below
      const allOrders = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as any[];

      const sortedOrders = [...allOrders].sort((a, b) => {
        // Now 'status' is recognized
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0; 
      });

      setOrders(sortedOrders);
    });

    return () => unsubscribe();
  }, []);

  // ✅ UPDATED: Safer Logic to update stats (works for Online Orders)
  const recordPermanentRevenue = async (amount: number) => {
    try {
      const statsRef = doc(db, "salesStats", "totals");
      // Using setDoc with merge: true ensures it never "hangs" if the doc is missing
      await setDoc(statsRef, {
        daily: increment(amount),
        monthly: increment(amount),
        yearly: increment(amount),
        lastUpdate: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Stats Update Error:", err);
    }
  };

  const sendWhatsAppNotification = async (order: any) => {
    try {
      const receiptUrl = `${window.location.origin}/receipt/${order.id}`;
      
      const messageText = `*ORDER DELIVERED*

Hello ${order.customerName},
Your order has been delivered!

*Details:*
• ID: ${order.id.slice(0, 8).toUpperCase()}
• Item: ${order.orderDetails}
• Qty: ${order.quantity}
• Total: ₦${order.totalAmount?.toLocaleString()}

*Delivery Address:*
${order.address}

*Receipt:*
${receiptUrl}

*NOTE:* Receipt link is valid for 48hrs. If not found contact our Support via our website.

_Thank you!_`;
          
      const encodedMessage = encodeURIComponent(messageText);
      
      let cleanNumber = order.phone.replace(/\D/g, ''); 
      if (cleanNumber.startsWith('0')) cleanNumber = '234' + cleanNumber.substring(1);
      else if (cleanNumber.length === 10) cleanNumber = '234' + cleanNumber;

      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error("WhatsApp Error:", error);
      const receiptUrl = `${window.location.origin}/receipt/${order.id}`;
      toast(
        <div className="p-4">
          <p className="font-bold mb-2">Receipt Link</p>
          <code className="bg-gray-100 p-2 rounded text-xs block break-all">{receiptUrl}</code>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(receiptUrl);
              toast.success("Copied!");
            }}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm"
          >
            Copy Link
          </button>
        </div>,
        { duration: 10000 }
      );
    }
  }

  const updateStatus = async (order: any) => {
    const tId = toast.loading("Finalizing sale and updating inventory...")
    try {
      const categoryName = order.category || '';
      
      if (!categoryName) {
        toast.error("Order category not found", { id: tId });
        return;
      }

      // 1. UPDATE ORDER STATUS
      await updateDoc(doc(db, "customersOrders", order.id), { 
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // 2. DEDUCT STOCK
      const inventoryRef = collection(db, "livestockCategories");
      const inventorySnap = await getDocs(inventoryRef);
      let foundCategory = false;
      
      for (const categoryDoc of inventorySnap.docs) {
        if (categoryDoc.data().name.toLowerCase() === categoryName.toLowerCase()) {
          foundCategory = true;
          await updateDoc(doc(db, "livestockCategories", categoryDoc.id), {
            stockQty: increment(-Number(order.quantity || 1)),
            updatedAt: serverTimestamp()
          });
          break;
        }
      }

      // ✅ 3. RECORD PERMANENT REVENUE (This is what updates your stats cards)
      await recordPermanentRevenue(Number(order.totalAmount) || 0);

      if (foundCategory) {
        toast.success("Stock deducted & Sale recorded!", { id: tId });
      } else {
        toast.success("Order delivered and revenue recorded!", { id: tId });
      }

      // 4. Notify Customer
      setTimeout(() => { sendWhatsAppNotification(order); }, 1000);

      setShowConfirmDelivery(false);
      setSelectedOrder(null);

    } catch (error) {
      console.error("Update Error:", error);
      toast.error("Failed to finalize sale", { id: tId });
      setShowConfirmDelivery(false);
      setSelectedOrder(null);
    }
  }

  const handleMarkDeliveryClick = (order: any) => {
    setSelectedOrder(order);
    setShowConfirmDelivery(true);
  }

  const deleteOrder = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-bold text-gray-800">Delete this order permanently?</p>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const dId = toast.loading("Deleting...");
              await deleteDoc(doc(db, "customersOrders", id));
              toast.success("Order deleted", { id: dId });
            }} 
            className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
          >
            Confirm
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 px-4 py-1.5 rounded-lg text-xs font-bold">Cancel</button>
        </div>
      </div>
    ), { duration: 5000 });
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-4 md:px-8">
      
      {showConfirmDelivery && selectedOrder && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Confirm Delivery</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Action Cannot Be Undone</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowConfirmDelivery(false);
                  setSelectedOrder(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Order ID</span>
                  <span className="text-sm font-black text-gray-900">{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer</span>
                  <span className="text-sm font-black text-emerald-700">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-lg font-black text-emerald-900">₦{selectedOrder.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Important Notice</p>
                    <p className="text-[11px] text-amber-600 mt-1 font-medium">
                      {"This action will: 1) Mark order as delivered 2) Deduct stock from inventory 3) Update permanent revenue 4) Notify customer"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus(selectedOrder)}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    Yes, Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmDelivery(false);
                      setSelectedOrder(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/admin')}
              className="text-sm md:text-base p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-all group"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-xl md:text-3xl font-bold flex items-center gap-3 text-gray-900">
                <ShoppingBagIcon className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                Customer Orders
              </h1>
              <p className="text-sm md:text-base text-gray-500 ml-11 -mt-1 font-medium tracking-tight">Manage and track live livestock requests</p>
            </div>
          </div>
          
          <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
            <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Active Requests: </span>
            <span className="text-green-600 font-black text-lg">{orders.length}</span>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(order => {
              const qty = parseInt(order.quantity) || 1;
              const total = order.totalAmount || 0;
              const unitCost = total > 0 ? total / qty : 0;
              const orderDate = order.createdAt?.toDate 
                ? order.createdAt.toDate().toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) 
                : '---';
              
              const displayCategory = order.category || '';

              return (
                <div key={order.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {order.status}
                      </span>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-mono">ID: {order.id.slice(0, 8)}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">{orderDate}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="text-sm md:text-base font-black text-gray-900 mb-1">{order.orderDetails}</h3>
                      {displayCategory && (
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                          Category: {displayCategory}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-sm font-bold text-green-600 mb-4 uppercase tracking-tight">{order.customerName}</p>

                    {order.status === 'delivered' && (
                      <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 text-blue-500" />
                        <a href={`${window.location.origin}/receipt/${order.id}`} target="_blank" className="text-[9px] text-blue-600 font-black uppercase tracking-tight hover:underline">
                          View Receipt
                        </a>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mb-1 flex items-center gap-1">
                          <BanknotesIcon className="w-3 h-3" /> Unit Cost
                        </p>
                        <p className="text-sm font-black text-emerald-900">₦{unitCost > 0 ? unitCost.toLocaleString() : '---'}</p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mb-1 flex items-center gap-1">
                          <HashtagIcon className="w-3 h-3" /> Quantity
                        </p>
                        <p className="text-sm font-black text-emerald-900">{qty}</p>
                      </div>
                    </div>

                    <div className="col-span-2 bg-emerald-900 p-3 rounded-lg border border-emerald-950 shadow-lg shadow-emerald-100">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Bill</p>
                        <p className="text-lg font-black text-white">₦{total > 0 ? total.toLocaleString() : 'No Amount Set'}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📞</span>
                          <span className="text-gray-700 font-bold">{order.phone}</span>
                        </div>
                        <a href={`tel:${order.phone}`} className="p-2 bg-white rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">
                          <PhoneIcon className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="flex items-start gap-2 pt-2 border-t border-gray-200/50">
                        <span className="text-gray-400">📍</span>
                        <span className="text-gray-600 leading-relaxed text-xs">{order.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    {order.status !== 'delivered' && (
                      <button onClick={() => handleMarkDeliveryClick(order)} className="flex-1 bg-green-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-95">
                        <CheckCircleIcon className="w-5 h-5" /> Mark Delivered
                      </button>
                    )}
                    <button onClick={() => deleteOrder(order.id)} className="p-3.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-gray-100 hover:border-red-200">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-gray-200 shadow-inner">
            <ShoppingBagIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 uppercase">No Orders Found</h2>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrders