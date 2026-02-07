'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { useParams, useRouter } from 'next/navigation'
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/solid'

export default function ReceiptPageUi() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [brand, setBrand] = useState({ 
    name: 'OBAAS Emmanuel Consult', 
    tagline: 'Expert Consultancy & Quality Service', 
    phone: '', 
    email: '' 
  })
  const [loading, setLoading] = useState(true)
  const [isPrintMode, setIsPrintMode] = useState(false)

  useEffect(() => {
    const fetchReceiptData = async () => {
      if (!id) return;
      try {
        const orderSnap = await getDoc(doc(db, "customersOrders", id as string));
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          setOrder(orderData.createdAt?.toDate ? orderData : {
            ...orderData,
            createdAt: orderData.createdAt ? { toDate: () => new Date(orderData.createdAt.seconds * 1000) } : null
          });
        }
        
        const settingsSnap = await getDoc(doc(db, "settings", "contact"));
        if (settingsSnap.exists()) {
          const settings = settingsSnap.data();
          setBrand({
            name: settings.companyName || 'OBAAS Emmanuel Consult',
            tagline: settings.tagline || 'Expert Consultancy & Quality Service',
            phone: settings.phoneNumber || '',
            email: settings.email || ''
          });
        }
      } catch (err) { console.error(err) } finally { setLoading(false) }
    };
    fetchReceiptData();
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-emerald-900 animate-pulse uppercase text-xs">Processing...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Record Not Found</div>

  const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---';
  
  // Logic updated to match PlaceOrderModal
  const qty = parseInt(order.quantity) || 1;
  const weight = parseFloat(order.weightPerUnit) || 0;
  // Unit price per KG
  const unitPricePerKg = order.totalAmount / (qty * (weight || 1));

  return (
    <>
      <style jsx global>{`
        @media print {
          body > *:not(.print-actual-target) { display: none !important; }
          html, body { 
            height: auto !important; 
            overflow: visible !important; 
            margin: 0 !important; 
            padding: 0 !important;
            background: white !important;
          }
          .print-actual-target { 
            display: block !important; 
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
          }
          .receipt-card-main {
            visibility: visible !important;
            display: block !important;
            margin: 0.5cm auto !important;
            width: 460px !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
          }
          .receipt-card-main * { visibility: visible !important; color: black !important; }
          .bg-emerald-900 { background-color: #f3f4f6 !important; border-bottom: 2px solid #000 !important; }
          .text-white, .text-emerald-400 { color: black !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {isPrintMode ? (
        <div className="fixed inset-0 z-[9999] bg-black overflow-y-auto pt-24 pb-20 px-1.5 print-actual-target no-scrollbar">
          <div className="fixed top-6 left-6 right-6 flex justify-between items-center no-print z-[10000]">
            <button onClick={() => setIsPrintMode(false)} className="bg-white/20 p-3 rounded-full text-white backdrop-blur-md hover:bg-white/30 transition-all">
              <XMarkIcon className="w-6 h-6" />
            </button>
            <button onClick={() => window.print()} className="p-5 bg-emerald-600 text-white rounded-full shadow-2xl active:scale-90 transition-all">
              <PrinterIcon className="w-7 h-7" />
            </button>
          </div>
          <div className="relative w-full flex justify-center">
            <div className="receipt-card-main bg-white w-full max-w-[460px] rounded-2xl overflow-hidden shadow-2xl border border-gray-100 mb-10">
              <ReceiptContent brand={brand} order={order} date={date} id={id} unitPrice={unitPricePerKg} weight={weight} qty={qty} />
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-emerald-50/20 flex flex-col justify-center items-center py-28 px-2">
          <div className="receipt-card-main bg-white w-full max-w-[460px] rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
            <ReceiptContent brand={brand} order={order} date={date} id={id} unitPrice={unitPricePerKg} weight={weight} qty={qty} />
          </div>
          <div className="w-full max-w-[460px] mt-6 no-print px-4">
            <button 
              onClick={() => setIsPrintMode(true)} 
              className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-900 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
            >
              <PrinterIcon className="w-5 h-5" /> Open Print Mode
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ReceiptContent({ brand, order, date, id, unitPrice, weight, qty }: any) {
  return (
    <>
      <div className="bg-emerald-900 p-4 text-center">
        <div className="p-1 w-14 h-14 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center shadow-md">
          <img src="/site_logo.png" alt="site logo" />
        </div>
        <h1 className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter">{brand.name}</h1>
        <p className="text-emerald-400 text-[9px] font-bold uppercase tracking-widest mt-1 tracking-[0.2em]">{brand.tagline}</p>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-8 text-left">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
            <h2 className="text-xl font-black text-gray-900 leading-tight">{order.customerName}</h2>
            <p className="text-[11px] font-bold text-emerald-700 mt-1 uppercase tracking-tight">Contact: {order.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">ID: {String(id).slice(0, 8).toUpperCase()}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase">{date}</p>
          </div>
        </div>

        <div className="space-y-4 border-y border-dashed border-gray-100 py-6 mb-8 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 uppercase font-black text-[9px] tracking-widest">Item</span>
            <span className="font-black text-gray-900 text-xs text-right max-w-[240px] leading-tight">{order.orderDetails}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 uppercase font-black text-[9px] tracking-widest">Price / KG</span>
            <span className="font-black text-gray-900 text-sm">₦{unitPrice.toLocaleString()}</span>
          </div>
          {/* ✅ Weight Display Added */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 uppercase font-black text-[9px] tracking-widest">Avg. Weight</span>
            <span className="font-black text-gray-900 text-sm">{weight} KG</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 uppercase font-black text-[9px] tracking-widest">Quantity</span>
            <span className="font-black text-gray-900 text-sm">x{qty}</span>
          </div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl flex justify-between items-center mb-6 border border-emerald-100">
          <span className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">Total Paid</span>
          <span className="text-2xl font-black text-emerald-900 tracking-tighter">₦{order.totalAmount?.toLocaleString()}</span>
        </div>

        <div className="text-center">
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Automated Transaction Record<br/>Generated by {brand.name}
          </p>
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[9px] text-emerald-700 font-black lowercase italic">
              Support Line: {brand.phone}
            </p>
            {brand.email && (
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                {brand.email}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="h-2 w-full bg-[radial-gradient(circle_at_bottom,_#f8fafc_10px,_transparent_10px)] bg-[length:20px_20px] bg-repeat-x"></div>
    </>
  )
}