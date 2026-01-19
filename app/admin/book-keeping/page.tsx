'use client'
import { useState, useEffect, useMemo } from 'react'
import { db, auth } from '@/lib/firebaseConfig' // Ensure auth is exported from your config
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  increment, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore'
import { 
  PlusIcon, 
  MinusIcon, 
  TrashIcon, 
  CircleStackIcon, 
  XMarkIcon, 
  TagIcon, 
  UserPlusIcon,
  PrinterIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  PresentationChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ChartPieIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  ClipboardDocumentListIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function MasterBookkeeping() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('') 
  const [historySearch, setHistorySearch] = useState('') 
  
  // UI States
  const [showAddForm, setShowAddForm] = useState(false)
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [showConfirmSale, setShowConfirmSale] = useState(false) 
  const [showSales, setShowSales] = useState(false) 
  const [showInventoryHistory, setShowInventoryHistory] = useState(false) 
  
  // CEO Security
  const [showClearOverlay, setShowClearOverlay] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [ceoPass, setCeoPass] = useState('')
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  
  const [selectedCategory, setSelectedCategory] = useState('')
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [stockQty, setStockQty] = useState('')
  const [walkInForm, setWalkInForm] = useState({ name: '', phone: '', category: '', qty: 1 })

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, "livestockCategories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    const unsubOrders = onSnapshot(
      query(collection(db, "customersOrders"), orderBy("createdAt", "desc")), 
      (snap) => {
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }
    )
    return () => { unsubCats(); unsubOrders(); }
  }, [])

  // ✅ NEW LOGIC: VERIFY PASSWORD AGAINST LOGIN ACCOUNT
  const verifyCEO = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error("No active CEO session");
      return false;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, ceoPass);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      toast.error("Incorrect Login Password");
      return false;
    }
  };

  const getCleanBreed = (fullName: string) => fullName ? fullName.split('(')[0].trim() : "Unknown";

  const openInventory = () => {
    setShowInventoryHistory(true);
    setShowAddForm(false);
    setShowSales(false);
  }

  const closeInventory = () => {
    setShowInventoryHistory(false);
    setHistorySearch('');
  }

  const activeAnimal = useMemo(() => {
    if (!walkInForm.category) return null;
    const searchName = getCleanBreed(walkInForm.category).toLowerCase();
    return categories.find(c => c.name.toLowerCase().trim() === searchName);
  }, [categories, walkInForm.category]);

  const isOverStock = activeAnimal && !lastOrderId ? walkInForm.qty > activeAnimal.stockQty : false;
  const currentTotal = (activeAnimal?.unitPrice || 0) * (Number(walkInForm.qty) || 0);

  const handleSingleDelete = async () => {
    // Logic updated to use verifyCEO
    const isVerified = await verifyCEO();
    if (isVerified) {
      await deleteDoc(doc(db, "customersOrders", itemToDelete!));
      toast.success("Record Deleted");
      setItemToDelete(null);
      setCeoPass('');
    }
  }

  const handleWipeHistory = async () => {
    // Logic updated to use verifyCEO
    const isVerified = await verifyCEO();
    if (isVerified) {
      const tId = toast.loading("Processing...");
      const delivered = orders.filter(o => o.status === 'delivered');
      for (const o of delivered) {
        await deleteDoc(doc(db, "customersOrders", o.id));
      }
      setShowClearOverlay(false);
      setCeoPass('');
      toast.success("History Cleared", { id: tId });
    }
  }

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [categories, searchTerm])

  const filteredHistory = useMemo(() => {
    return orders.filter(o => 
      o.status === 'delivered' && 
      (o.customerName?.toLowerCase().includes(historySearch.toLowerCase()) || 
       o.orderDetails?.toLowerCase().includes(historySearch.toLowerCase()))
    )
  }, [orders, historySearch])

  const graphData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { dateStr: d.toDateString(), label: d.toLocaleDateString('en-US', { weekday: 'short' }), total: 0 };
    }).reverse();
    orders.forEach(order => {
      if (order.status === 'delivered') {
        const orderDate = order.createdAt?.toDate()?.toDateString();
        const day = last7Days.find(d => d.dateStr === orderDate);
        if (day) day.total += Number(order.totalAmount) || 0;
      }
    });
    const maxVal = Math.max(...last7Days.map(d => d.total), 1);
    const points = last7Days.map((d, i) => `${(i * 100) / 6},${100 - (d.total / maxVal) * 100}`).join(' ');
    return { days: last7Days, points, maxVal };
  }, [orders]);

  const salesStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const todayFormatted = now.toLocaleDateString('en-GB');
    const monthFormatted = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const yearFormatted = now.getFullYear().toString();
    const categoryQty: Record<string, number> = {};
    let totalQtyToday = 0;

    const totals = orders.reduce((acc, order) => {
      if (order.status !== 'delivered') return acc;
      const date = order.createdAt?.toDate();
      if (!date) return acc;
      const amount = Number(order.totalAmount) || 0;
      const qty = Number(order.quantity) || 1;
      
      if (date.toDateString() === todayStr) {
        acc.daily += amount;
        totalQtyToday += qty;
        const catName = getCleanBreed(order.orderDetails);
        categoryQty[catName] = (categoryQty[catName] || 0) + qty;
      }
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) acc.monthly += amount;
      if (date.getFullYear() === now.getFullYear()) acc.yearly += amount;
      return acc;
    }, { daily: 0, monthly: 0, yearly: 0 });

    const sortedMix = Object.entries(categoryQty)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    return { ...totals, todayFormatted, monthFormatted, yearFormatted, sortedMix, totalQtyToday };
  }, [orders]);

  const handleCategoryChange = (name: string) => {
    setSelectedCategory(name);
    const animal = categories.find(c => c.name === name);
    setUnitPriceInput(animal ? animal.unitPrice.toString() : '');
  }

  const confirmDelete = (cat: any) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-800">Delete <span className="text-red-600 uppercase">{cat.name}</span>?</p>
        <div className="flex gap-2">
          <button onClick={async () => { toast.dismiss(t.id); await deleteDoc(doc(db, "livestockCategories", cat.id)); toast.success("Deleted"); }} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">No</button>
        </div>
      </div>
    ));
  };

  const processFinalSale = async () => {
    if (isOverStock) return toast.error("Reduce quantity to match stock!");
    const tId = toast.loading("Processing...");
    try {
      const cleanBreed = getCleanBreed(walkInForm.category);
      const orderRef = await addDoc(collection(db, "customersOrders"), {
        customerName: walkInForm.name, phone: walkInForm.phone, address: "Walk-in (In-Store)",
        orderDetails: cleanBreed, quantity: walkInForm.qty, totalAmount: currentTotal,
        status: 'delivered', createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "livestockCategories", activeAnimal.id), { stockQty: increment(-Number(walkInForm.qty)) });
      setLastOrderId(orderRef.id);
      setShowConfirmSale(false);
      toast.success("Sold!", { id: tId });
    } catch (err) { toast.error("Error"); }
  }

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = toast.loading("Updating...");
    try {
      const existingDoc = categories.find(c => c.name === selectedCategory);
      await updateDoc(doc(db, "livestockCategories", existingDoc.id), { unitPrice: Number(unitPriceInput), stockQty: increment(Number(stockQty)) });
      toast.success("Updated!"); setSelectedCategory(''); setUnitPriceInput(''); setStockQty(''); setShowAddForm(false);
    } catch (err) { toast.error("Failed"); }
  }

  const handleQuickAdjust = (id: string, amount: number) => {
    updateDoc(doc(db, "livestockCategories", id), { stockQty: increment(amount) }).catch(() => toast.error("Error"));
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-3 md:px-8 font-sans"> 

      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-bold mb-2 transition-colors group">
        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button> 

      {/* CEO SECURITY OVERLAYS */}
      {showClearOverlay && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-white p-10 rounded-xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
                <LockClosedIcon className="w-10 h-10 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tighter">Authorize Wipe</h2>
                <input type="password" placeholder="CEO Password" className="w-full mt-6 p-5 bg-gray-50 border-2 rounded-xl text-center font-black outline-none focus:border-red-500" onChange={e => setCeoPass(e.target.value)} />
                <button onClick={handleWipeHistory} className="w-full mt-4 bg-red-600 text-white py-5 rounded-xl font-black uppercase text-xs">Execute Wipe</button>
                <button onClick={() => setShowClearOverlay(false)} className="mt-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Cancel</button>
            </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[400] bg-emerald-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white p-10 rounded-xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
                <ShieldCheckIcon className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tighter">CEO Authentication</h2>
                <input type="password" placeholder="CEO Password" className="w-full mt-6 p-5 bg-gray-50 border-2 rounded-xl text-center font-black outline-none focus:border-amber-500" onChange={e => setCeoPass(e.target.value)} />
                <button onClick={handleSingleDelete} className="w-full mt-4 bg-emerald-900 text-white py-5 rounded-xl font-black uppercase text-xs">Delete Record</button>
                <button onClick={() => setItemToDelete(null)} className="mt-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Go Back</button>
            </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          {!showInventoryHistory && (
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                 <CircleStackIcon className="w-8 h-8 text-emerald-600" /> Bookkeeping
              </h1>
              <p className="text-gray-500 text-xs md:text-sm font-medium tracking-tight">Daily Performance & Stock</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {!showInventoryHistory && (
              <>
                <button onClick={() => { setLastOrderId(null); setShowWalkInModal(true); }} className="flex-1 md:flex-none bg-white text-emerald-900 border-2 border-emerald-900 px-6 py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-sm">
                    <UserPlusIcon className="w-5 h-5" /> Walk-In
                </button>
                <button onClick={openInventory} className="flex-1 md:flex-none bg-white text-amber-600 border-2 border-amber-500 px-6 py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-sm">
                    <ClipboardDocumentListIcon className="w-5 h-5" /> Inventory
                </button>
                <button onClick={() => setShowAddForm(!showAddForm)} className="flex-1 md:flex-none bg-emerald-900 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-lg">
                    {showAddForm ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />} Stock
                </button>
              </>
            )}
          </div>
        </div>

        {showInventoryHistory ? (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
             <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-emerald-50/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-900 rounded-xl text-white"><ClipboardDocumentListIcon className="w-6 h-6" /></div>
                        <div><h2 className="font-black text-gray-900 uppercase text-xs tracking-widest">Transaction History</h2><p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Audit Logs</p></div>
                    </div>
                    <div className="relative flex-1 max-w-sm">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-4 text-gray-400" />
                        <input type="text" placeholder="Search customer or breed..." className="w-full pl-12 pr-4 py-4 bg-white border rounded-xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500" value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowClearOverlay(true)} className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-5 py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all">Wipe History</button>
                        <button onClick={closeInventory} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-bold text-sm">
                        <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                            <tr><th className="p-8">Date</th><th className="p-8">Transaction</th><th className="p-8">Breed</th><th className="p-8">Revenue</th><th className="p-8 text-right">Delete</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredHistory.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-8 text-gray-400 font-black text-[10px] uppercase">{order.createdAt?.toDate().toLocaleDateString('en-GB')}</td>
                                    <td className="p-8"><div className="text-gray-900 uppercase text-xs font-black">{order.customerName}</div><div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{order.phone}</div></td>
                                    <td className="p-8"><div className="inline-flex flex-col"><span className="text-emerald-700 text-xs font-black uppercase">{getCleanBreed(order.orderDetails)}</span><span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest italic">Qty: {order.quantity}</span></div></td>
                                    <td className="p-8 font-black text-emerald-900 text-base">₦{order.totalAmount?.toLocaleString()}</td>
                                    <td className="p-8 text-right">
                                        <button onClick={() => setItemToDelete(order.id)} className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
        ) : (
          <>
            {showWalkInModal && (
              <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-500 ${lastOrderId ? 'bg-black' : 'bg-emerald-950/60 backdrop-blur-sm'}`}>
                <div className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative">
                  {isOverStock && !lastOrderId && (
                    <div className="p-4 bg-red-600 text-white flex items-center gap-3 animate-in slide-in-from-top"><ExclamationCircleIcon className="w-6 h-6 shrink-0" /><div className="text-[10px] font-black uppercase leading-tight">Error: Only {activeAnimal.stockQty} left.</div></div>
                  )}
                  {showConfirmSale && !lastOrderId && (
                    <div className="absolute inset-0 z-[210] bg-white p-8 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                      <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mb-4"><ExclamationTriangleIcon className="w-10 h-10 text-amber-600" /></div>
                      <h3 className="text-xl font-black text-gray-900 uppercase mb-2">Finalize Sale?</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 px-4">Qty <span className="text-emerald-700">{walkInForm.qty} {getCleanBreed(walkInForm.category)}</span><br /> Total: <span className="text-emerald-700">₦{currentTotal.toLocaleString()}</span></p>
                      <div className="w-full space-y-3">
                        <button onClick={processFinalSale} className="w-full py-4 bg-emerald-900 text-white rounded-xl font-black text-xs uppercase shadow-xl transition-all">Confirm Sale</button>
                        <button onClick={() => setShowConfirmSale(false)} className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-black text-xs uppercase">Go Back</button>
                      </div>
                    </div>
                  )} 
                  <div className="bg-emerald-900 p-6 text-white text-center relative no-print">
                    <button onClick={() => setShowWalkInModal(false)} className="absolute top-6 right-6 text-emerald-400 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
                    <h2 className="text-xl font-black uppercase tracking-tighter">{lastOrderId ? "Success" : "Walk-In Order"}</h2>
                  </div>
                  {lastOrderId ? (
                    <div className="p-8 text-center space-y-6">
                      <CheckBadgeIcon className="w-16 h-16 text-emerald-600 mx-auto animate-pulse" />
                      <button onClick={() => router.push(`/receipt/${lastOrderId}`)} className="w-full py-5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-xl"><PrinterIcon className="w-6 h-6" /> View Receipt</button>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="bg-emerald-900 p-4 rounded-xl mb-4 text-white flex justify-between items-center shadow-inner"><div className="text-left"><p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Bill</p><p className="font-black text-lg text-emerald-300">₦{currentTotal.toLocaleString()}</p></div><p className="font-bold text-xs uppercase tracking-widest">{getCleanBreed(walkInForm.category) || "---"}</p></div>
                      <form onSubmit={(e) => { e.preventDefault(); setShowConfirmSale(true); }} className="space-y-3">
                        <input required placeholder="Customer Name" className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm border focus:ring-1 focus:ring-emerald-500" onChange={e => setWalkInForm({...walkInForm, name: e.target.value})} />
                        <input required placeholder="Phone Number" className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm border focus:ring-1 focus:ring-emerald-500" onChange={e => setWalkInForm({...walkInForm, phone: e.target.value})} />
                        <div className="grid grid-cols-2 gap-3"><select required className="p-4 bg-gray-50 rounded-xl font-bold text-sm border" onChange={e => setWalkInForm({...walkInForm, category: e.target.value})}><option value="">Category</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select><input required type="number" min="1" placeholder="Qty" className={`p-4 rounded-xl font-bold text-sm border outline-none ${isOverStock ? 'bg-red-50 border-red-500 text-red-600' : 'bg-gray-50'}`} onChange={e => setWalkInForm({...walkInForm, qty: parseInt(e.target.value) || 1})} /></div>
                        <button type="submit" disabled={isOverStock} className={`w-full py-5 rounded-xl font-black text-xs uppercase shadow-xl transition-all ${isOverStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-emerald-900 text-white active:scale-95'}`}>{isOverStock ? 'Low Stock' : 'Complete Sale'}</button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showAddForm && (
              <div className="bg-white p-6 rounded-xl shadow-xl mb-12 border border-emerald-100 animate-in slide-in-from-top-2 duration-300">
                <form onSubmit={handleSaveStock} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1"><label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Animal</label><select required className="p-4 bg-gray-50 rounded-xl font-bold text-sm border appearance-none" value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}><option value="">Category</option>{categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select></div>
                  <div className="flex flex-col gap-1"><label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Unit Price</label><input required type="number" className="p-4 bg-gray-50 rounded-xl font-bold text-sm border" value={unitPriceInput} onChange={e => setUnitPriceInput(e.target.value)} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Qty to Add</label><input required type="number" className="p-4 bg-gray-50 rounded-xl font-bold text-sm border" value={stockQty} onChange={e => setStockQty(e.target.value)} /></div>
                  <button type="submit" className="md:col-span-3 w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg transition-all active:scale-95">Update Inventory</button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4"><h2 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2"><TagIcon className="w-4 h-4 text-emerald-600" /> Stock Table</h2><div className="relative w-full md:w-64"><MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="Search animal..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-emerald-500 text-xs font-bold transition-all outline-none uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left font-bold text-sm">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <tr>
                      <th className="p-6">Breed</th>
                      <th className="p-6">Price</th>
                      <th className="p-6 text-center">Stock</th>
                      <th className="p-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCategories.map((cat) => 
                      (<tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-6 text-gray-900 uppercase tracking-tight">{cat.name}</td>
                        <td className="p-6 text-emerald-800 font-black">₦{cat.unitPrice?.toLocaleString()}</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-4">
                            <button onClick={() => handleQuickAdjust(cat.id, -1)} className="text-gray-300 hover:text-red-600 transition-colors">
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <span className={`min-w-[20px] text-center font-black ${cat.stockQty < 5 ? 'text-red-500' : 'text-gray-900'}`}>{cat.stockQty}</span>
                            <button onClick={() => handleQuickAdjust(cat.id, 1)} className="text-gray-300 hover:text-emerald-600 transition-colors">
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <button onClick={() => confirmDelete(cat)} className="p-2 bg-red-50 text-red-600 rounded-lg shadow-sm">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-12">
              <button onClick={() => setShowSales(!showSales)} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 text-left"><ArrowTrendingUpIcon className="w-6 h-6 text-emerald-600" /><div><h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Performance Stats</h3><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest tracking-tight">Revenue & Sales Mix</p></div></div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showSales ? 'rotate-180' : ''}`} />
              </button>
              {showSales && (
                <div className="p-6 pt-2 animate-in slide-in-from-top-4 duration-500 border-t border-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 pt-8 text-center"><div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100 text-center"><p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Today Revenue</p><p className="text-[8px] font-bold text-emerald-400 mb-3">{salesStats.todayFormatted}</p><p className="text-2xl font-black text-emerald-900">₦{salesStats.daily.toLocaleString()}</p></div><div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 text-center"><p className="text-[10px] font-black text-blue-600 uppercase mb-1">Items Sold Today</p><p className="text-[8px] font-bold text-blue-400 mb-3">{salesStats.totalQtyToday} Total Qty</p><p className="text-2xl font-black text-blue-900">₦{salesStats.monthly.toLocaleString()}</p></div><div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100 text-center"><p className="text-[10px] font-black text-purple-600 uppercase mb-1">Annual Total</p><p className="text-[8px] font-bold text-purple-400 mb-3">{salesStats.yearFormatted}</p><p className="text-2xl font-black text-purple-900">₦{salesStats.yearly.toLocaleString()}</p></div></div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><PresentationChartBarIcon className="w-4 h-4 text-emerald-600" /> 7-Day Trend</h4><span className="text-[8px] font-black bg-gray-100 px-2 py-1 rounded-full text-gray-500 uppercase">Peak: ₦{graphData.maxVal.toLocaleString()}</span></div>
                        <div className="relative w-full h-48"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full"><polyline fill="#10b98120" points={`0,100 ${graphData.points} 100,100`} /><polyline fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={graphData.points} /></svg></div>
                        <div className="flex justify-between px-1">{graphData.days.map((d, i) => (<div key={i} className="flex flex-col items-center gap-1"><span className="text-[8px] font-black text-gray-400 uppercase">{d.label}</span><div className={`w-1 h-1 rounded-full ${d.total > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-200'}`}></div></div>))}</div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ChartPieIcon className="w-4 h-4 text-emerald-600" /> Sales Mix (Quantity)</h4>
                            <button onClick={() => setShowClearOverlay(true)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                                <ArrowPathIcon className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                            {salesStats.sortedMix.length > 0 ? salesStats.sortedMix.map(([name, qty]: [string, number]) => {
                                const percentage = (qty / (salesStats.totalQtyToday || 1)) * 100;
                                return (
                                    <div key={name} className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                            <span className="text-gray-600">{name}</span>
                                            <span className="text-emerald-700">{qty} Sold</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                )
                            }) : <p className="text-[9px] font-bold text-gray-400 uppercase italic text-center py-6 tracking-widest">No activity</p>}
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}