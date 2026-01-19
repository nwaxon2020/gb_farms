'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebaseConfig'
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  increment, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore'
import { 
  PlusIcon, 
  MinusIcon, 
  TrashIcon, 
  CircleStackIcon, 
  XMarkIcon, 
  TagIcon, 
  ArrowPathIcon,
  UserPlusIcon,
  PrinterIcon,
  CheckBadgeIcon,
  PhoneIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function MasterBookkeeping() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  
  const [selectedCategory, setSelectedCategory] = useState('')
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [stockQty, setStockQty] = useState('')

  const [walkInForm, setWalkInForm] = useState({
    name: '',
    phone: '',
    category: '',
    qty: 1
  })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "livestockCategories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const animal = categories.find(c => c.name === categoryName);
    if (animal) {
      setUnitPriceInput(animal.unitPrice.toString());
    } else {
      setUnitPriceInput('');
    }
  }

  // ✅ CONFIRMATION TOAST FOR DELETE
  const confirmDelete = (cat: any) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-800">
          Delete <span className="text-red-600 uppercase">{cat.name}</span> category?
        </p>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await deleteDoc(doc(db, "livestockCategories", cat.id));
                toast.success("Category Deleted");
              } catch (e) { toast.error("Error deleting"); }
            }}
            className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase"
          >
            Yes, Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const activeAnimal = categories.find(c => c.name === walkInForm.category);
  const currentUnitPrice = activeAnimal?.unitPrice || 0;
  const currentTotal = currentUnitPrice * (Number(walkInForm.qty) || 0);

  const initializeCategories = async () => {
    const tId = toast.loading("Initializing...");
    try {
      const batch = writeBatch(db);
      const defaults = [
        { name: 'Cow', unitPrice: 0, stockQty: 0 },
        { name: 'Goat', unitPrice: 0, stockQty: 0 },
        { name: 'Fish', unitPrice: 0, stockQty: 0 },
        { name: 'Chicken', unitPrice: 0, stockQty: 0 },
        { name: 'Pig', unitPrice: 0, stockQty: 0 }
      ];
      defaults.forEach((item) => {
        const newDocRef = doc(collection(db, "livestockCategories"));
        batch.set(newDocRef, { ...item, createdAt: serverTimestamp() });
      });
      await batch.commit();
      toast.success("Categories Ready!", { id: tId });
    } catch (err) { toast.error("Failed", { id: tId }); }
  }

  const handleWalkInSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAnimal || activeAnimal.stockQty < walkInForm.qty) {
      return toast.error("Insufficient stock!");
    }
    const tId = toast.loading("Processing Sale...");
    try {
      const orderRef = await addDoc(collection(db, "customersOrders"), {
        customerName: walkInForm.name,
        phone: walkInForm.phone,
        address: "Walk-in Customer (In-Store)",
        orderDetails: walkInForm.category,
        quantity: walkInForm.qty,
        totalAmount: currentTotal,
        status: 'delivered', 
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "livestockCategories", activeAnimal.id), {
        stockQty: increment(-Number(walkInForm.qty))
      });
      setLastOrderId(orderRef.id);
      toast.success("Sale Recorded!", { id: tId });
    } catch (err) { toast.error("Error", { id: tId }); }
  }

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = toast.loading("Updating...");
    try {
      const existingDoc = categories.find(c => c.name === selectedCategory);
      await updateDoc(doc(db, "livestockCategories", existingDoc.id), {
        unitPrice: Number(unitPriceInput),
        stockQty: increment(Number(stockQty))
      });
      toast.success("Stock Updated!", { id: tId });
      setSelectedCategory(''); setUnitPriceInput(''); setStockQty(''); setShowAddForm(false);
    } catch (err) { toast.error("Failed", { id: tId }); }
  }

  const handleQuickAdjust = async (id: string, amount: number) => {
    try {
      await updateDoc(doc(db, "livestockCategories", id), { stockQty: increment(amount) });
    } catch (err) { toast.error("Error"); }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-3 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
               <CircleStackIcon className="w-8 h-8 text-emerald-600" />
               Bookkeeping
            </h1>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Stock levels and Walk-in sales</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
                onClick={() => { setLastOrderId(null); setShowWalkInModal(true); }}
                className="w-full bg-white text-emerald-900 border-2 border-emerald-900 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
                <UserPlusIcon className="w-5 h-5" /> Walk-In Sale
            </button>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full bg-emerald-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {showAddForm ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
              {showAddForm ? "Close Form" : "Update Stock"}
            </button>
          </div>
        </div>

        {/* WALK-IN MODAL (Responsive) */}
        {showWalkInModal && (
          <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-500 ${lastOrderId ? 'bg-black' : 'bg-emerald-950/60 backdrop-blur-sm'}`}>
            <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="bg-emerald-900 p-6 text-white text-center relative no-print">
                <button onClick={() => setShowWalkInModal(false)} className="absolute top-6 right-6 text-emerald-400 hover:text-white transition-colors"><XMarkIcon className="w-5 h-5"/></button>
                <h2 className="text-xl font-black uppercase tracking-tighter">{lastOrderId ? "Sale Saved" : "Walk-In Order"}</h2>
              </div>

              {lastOrderId ? (
                <div className="p-8 text-center space-y-6">
                    <CheckBadgeIcon className="w-16 h-16 text-emerald-600 mx-auto animate-pulse" />
                    <button onClick={() => router.push(`/receipt/${lastOrderId}`)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                        <PrinterIcon className="w-5 h-5" /> Generate Receipt
                    </button>
                </div>
              ) : (
                <div className="p-6">
                    <div className="bg-emerald-900 p-4 rounded-2xl mb-4 text-white flex justify-between items-center">
                        <div className="text-left">
                            <p className="text-[9px] font-black text-emerald-400 uppercase">Live Bill</p>
                            <p className="font-black text-lg text-emerald-300">₦{currentTotal.toLocaleString()}</p>
                        </div>
                        <p className="font-bold text-xs uppercase tracking-widest">{walkInForm.category || "---"}</p>
                    </div>

                    <form onSubmit={handleWalkInSale} className="space-y-3">
                        <input required placeholder="Customer Name" className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm border focus:ring-1 focus:ring-emerald-500"
                            onChange={e => setWalkInForm({...walkInForm, name: e.target.value})} />
                        <input required placeholder="Phone Number" className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm border focus:ring-1 focus:ring-emerald-500"
                            onChange={e => setWalkInForm({...walkInForm, phone: e.target.value})} />
                        <div className="grid grid-cols-2 gap-3">
                            <select required className="p-4 bg-gray-50 rounded-xl font-bold text-sm border appearance-none"
                                onChange={e => setWalkInForm({...walkInForm, category: e.target.value})}>
                                <option value="">Category</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <input required type="number" min="1" placeholder="Qty" className="p-4 bg-gray-50 rounded-xl font-bold text-sm border"
                                onChange={e => setWalkInForm({...walkInForm, qty: parseInt(e.target.value) || 1})} />
                        </div>
                        <button type="submit" className="w-full py-5 bg-emerald-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all active:scale-95">Complete Sale</button>
                    </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ UPDATE STOCK FORM (Ultra Responsive Labels) */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-xl shadow-xl mb-12 border border-emerald-100 animate-in slide-in-from-top-2">
            <form onSubmit={handleSaveStock} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Select Animal</label>
                <select required className="p-4 bg-gray-50 rounded-xl font-bold text-sm border focus:ring-1 focus:ring-emerald-500 appearance-none"
                    value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                    <option value="">Choose Category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Unit Price (₦)</label>
                <input required type="number" placeholder="0.00" className="p-4 bg-gray-50 rounded-xl font-bold text-sm border focus:ring-1 focus:ring-emerald-500"
                    value={unitPriceInput} onChange={e => setUnitPriceInput(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Quantity to Add</label>
                <input required type="number" placeholder="0" className="p-4 bg-gray-50 rounded-xl font-bold text-sm border focus:ring-1 focus:ring-emerald-500"
                    value={stockQty} onChange={e => setStockQty(e.target.value)} />
              </div>
              <button type="submit" className="md:col-span-3 w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg transition-all active:scale-95">Update Inventory</button>
            </form>
          </div>
        )}

        {/* INVENTORY LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-emerald-600" /> Active Inventory
              </h2>
              {categories.length === 0 && !loading && (
                <button onClick={initializeCategories} className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1">
                  <ArrowPathIcon className="w-4 h-4" /> Reset
                </button>
              )}
          </div>

          {/* TABLE VIEW (Hidden on Mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="text-[10px] font-black uppercase text-gray-400">
                  <th className="p-6">Category</th>
                  <th className="p-6">Unit Price</th>
                  <th className="p-6 text-center">In Stock</th>
                  <th className="p-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-sm">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50">
                    <td className="p-6 text-gray-900 uppercase">{cat.name}</td>
                    <td className="p-6 text-emerald-800">₦{cat.unitPrice?.toLocaleString()}</td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-4">
                        <button onClick={() => handleQuickAdjust(cat.id, -1)} className="text-gray-300 hover:text-red-600 transition-colors"><MinusIcon className="w-4 h-4" /></button>
                        <span className="min-w-[20px] text-center font-black">{cat.stockQty}</span>
                        <button onClick={() => handleQuickAdjust(cat.id, 1)} className="text-gray-300 hover:text-emerald-600 transition-colors"><PlusIcon className="w-4 h-4" /></button>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      {/* ✅ VIBRANT RED DELETE BUTTON */}
                      <button 
                        onClick={() => confirmDelete(cat)} 
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ MOBILE CARD VIEW (Responsive Grid) */}
          <div className="md:hidden divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat.id} className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                  <span className="font-black text-gray-900 uppercase text-xs">{cat.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                  <span className="font-black text-emerald-700 text-xs">₦{cat.unitPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">In Stock</span>
                  <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <button onClick={() => handleQuickAdjust(cat.id, -1)} className="text-gray-400 active:text-red-500"><MinusIcon className="w-4 h-4" /></button>
                    <span className="font-black text-lg text-gray-900 min-w-[30px] text-center">{cat.stockQty}</span>
                    <button onClick={() => handleQuickAdjust(cat.id, 1)} className="text-gray-400 active:text-emerald-500"><PlusIcon className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  {/* ✅ HIGH CONTRAST DELETE BUTTON FOR MOBILE */}
                   <button 
                    onClick={() => confirmDelete(cat)} 
                    className="p-3 bg-red-700 text-white rounded-xl shadow-lg shadow-red-100 active:scale-90 transition-all"
                   >
                     <TrashIcon className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}