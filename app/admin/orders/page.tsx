'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebaseConfig'
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore'
import { 
  CheckCircleIcon, 
  TrashIcon, 
  ShoppingBagIcon, 
  ArrowLeftIcon,
  PhoneIcon,
  BanknotesIcon,
  HashtagIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const q = query(collection(db, "customersOrders"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [])

  const sendWhatsAppNotification = async (order: any) => {
    try {
      const settingsSnap = await getDoc(doc(db, "settings", "contact"));
      const message = `Hello ${order.customerName}, your order for "${order.orderDetails}" has been successfully delivered! Thank you for choosing FarmFresh.`;
      const whatsappUrl = `https://wa.me/${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("WhatsApp Error:", error);
    }
  }

  const updateStatus = async (order: any) => {
    const tId = toast.loading("Updating status...")
    try {
      await updateDoc(doc(db, "customersOrders", order.id), { status: 'delivered' })
      toast.success("Order marked as delivered!", { id: tId })
      sendWhatsAppNotification(order);
    } catch (error) {
      toast.error("Failed to update status", { id: tId })
    }
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
              // LOGIC: Calculate unit cost if totalAmount exists
              const qty = parseInt(order.quantity) || 1;
              const total = order.totalAmount || 0;
              const unitCost = total > 0 ? total / qty : 0;

              return (
                <div key={order.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {order.status}
                      </span>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {order.id.slice(0, 8)}</p>
                    </div>
                    
                    <h3 className="text-sm md:text-base font-black text-gray-900 mb-1">{order.orderDetails}</h3>
                    <p className="text-sm font-bold text-green-600 mb-4 uppercase tracking-tight">{order.customerName}</p>
                    
                    {/* ✅ PRICING & BREAKDOWN SECTION */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mb-1 flex items-center gap-1">
                          <BanknotesIcon className="w-3 h-3" /> Unit Cost
                        </p>
                        <p className="text-sm font-black text-emerald-900">
                          ₦{unitCost > 0 ? unitCost.toLocaleString() : '---'}
                        </p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mb-1 flex items-center gap-1">
                          <HashtagIcon className="w-3 h-3" /> Quantity
                        </p>
                        <p className="text-sm font-black text-emerald-900">{qty}</p>
                      </div>
                      
                    </div>

                    {/* Total-Amount display */}
                    <div className="col-span-2 bg-emerald-900 p-3 rounded-lg border border-emerald-950 shadow-lg shadow-emerald-100">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Bill</p>
                          <p className="text-lg font-black text-white">
                            ₦{total > 0 ? total.toLocaleString() : 'No Amount Set'}
                          </p>
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
                      <button 
                        onClick={() => updateStatus(order)}
                        className="flex-1 bg-green-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-95"
                      >
                        <CheckCircleIcon className="w-5 h-5" /> Mark Delivered
                      </button>
                    )}
                    <button 
                      onClick={() => deleteOrder(order.id)}
                      className="p-3.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-gray-100 hover:border-red-200"
                    >
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