'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db, storage, auth } from '@/lib/firebaseConfig'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import toast from 'react-hot-toast'
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowUpTrayIcon, PhotoIcon, UserCircleIcon, CalendarIcon, ArrowLeftIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function AdminLivestock() {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [livestock, setLivestock] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([]) 
  const [header, setHeader] = useState({ title: '', subtitle: '', heroImage: '' })
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [isHeroOpen, setIsHeroOpen] = useState(false) 

  const [form, setForm] = useState({ breed: '', name: '', price: '', desc: '', specs: '', image: '', color: 'bg-emerald-900' })
  const [newCategoryName, setNewCategoryName] = useState('') 
  const [editId, setEditId] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const heroImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "livestock"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLivestock(docs.sort((a: any, b: any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
    })

    const unsubCats = onSnapshot(collection(db, "livestockCategories"), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })

    getDoc(doc(db, "settings", "livestockPage")).then(d => {
      if(d.exists()) setHeader(d.data() as any)
    })
    return () => { unsub(); unsubCats(); }
  }, [])

  const formatName = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  const getColor = (animal: string) => {
    const formatted = formatName(animal);
    const colors: Record<string, string> = {
      Pig: "bg-amber-600", Snail: "bg-red-700", Goat: "bg-gray-800",
      Chicken: "bg-blue-800", Cow: "bg-emerald-900", Fish: "bg-green-500",
    };
    return colors[formatted] || "bg-emerald-900";
  };

  const handleUpload = async (file: File, path: string, setStatus: (val: boolean) => void) => {
    setStatus(true); const tId = toast.loading("Uploading image...");
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      toast.success("Upload complete!", { id: tId }); setStatus(false); return url;
    } catch (err) { toast.error("Upload failed"); setStatus(false); return null; }
  }

  // ✅ UPDATED SAVE LOGIC
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!form.image) return toast.error("Please upload an image first");
    setLoading(true)
  
    try {
      let finalCategory = form.name;

      if (form.name === 'other' && newCategoryName) {
        const formattedNewCat = formatName(newCategoryName);
        const exists = categories.find(c => c.name === formattedNewCat);
        if (!exists) {
          await addDoc(collection(db, "livestockCategories"), {
            name: formattedNewCat,
            unitPrice: Number(form.price),
            stockQty: 0, 
            createdAt: serverTimestamp()
          });
        }
        finalCategory = formattedNewCat;
      }

      // We explicitly map the data to avoid sending the 'id' field back to Firestore
      const data = { 
        breed: form.breed,
        name: finalCategory,
        price: Number(form.price),
        desc: form.desc,
        specs: form.specs,
        image: form.image,
        color: getColor(finalCategory),
        updatedAt: serverTimestamp(),
        addedBy: user?.email || 'Unknown Admin' 
      }

      if (editId) {
        await updateDoc(doc(db, "livestock", editId), data)
        toast.success("Updated successfully")
      } else {
        await addDoc(collection(db, "livestock"), { ...data, createdAt: serverTimestamp() })
        toast.success("Added to catalog")
      }

      // Reset
      setForm({ breed: '', name: '', price: '', desc: '', specs: '', image: '', color: 'bg-emerald-900'})
      setNewCategoryName('')
      setEditId(null)
    } catch (err: any) { 
      console.error(err);
      toast.error(`Error: ${err.message}`) 
    }
    setLoading(false)
  }

  const handleDelete = async (item: any) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-gray-800">Delete {item.breed} permanently?</p>
        <div className="flex gap-2">
          <button onClick={async () => {
              toast.dismiss(t.id); const tId = toast.loading("Removing...");
              try {
                await deleteDoc(doc(db, "livestock", item.id));
                if (item.image?.includes("firebasestorage")) await deleteObject(ref(storage, item.image));
                toast.success("Removed", { id: tId });
              } catch (err) { toast.error("Failed"); }
            }} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Confirm</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 px-4 py-1.5 rounded-lg text-xs font-bold">Cancel</button>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-3 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-bold mb-6 transition-colors group">
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white p-3 py-5 md:p-8 rounded-lg shadow-sm border border-emerald-100">
              <h2 className="text-xl md:text-2xl font-black text-emerald-900 mb-6 flex items-center gap-2">
                <PlusIcon className="w-6 h-6" /> {editId ? 'Edit Mode' : 'New Animal'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <input required placeholder="Breed Name" className="w-full p-3 bg-gray-50 rounded-lg border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500" 
                  value={form.breed} onChange={e => setForm({...form, breed: e.target.value})} />
                
                <div className="grid grid-cols-1 gap-3">
                  <select required className="p-3 bg-gray-50 rounded-lg ring-1 ring-gray-200 font-bold text-sm" 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="other" className="text-emerald-600 font-black">+ Create New Category</option>
                  </select>

                  {form.name === 'other' && (
                    <input required placeholder="New Category Name" className="w-full p-3 bg-emerald-50 rounded-lg ring-1 ring-emerald-300" 
                      value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                  )}

                  <input required type="number" placeholder="Price ₦" className="p-3 bg-gray-50 rounded-lg ring-1 ring-gray-200" 
                    value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>

                <input placeholder="Specs (e.g. 50kg)" className="w-full p-4 bg-gray-50 rounded-lg ring-1 ring-gray-200" 
                  value={form.specs} onChange={e => setForm({...form, specs: e.target.value})} />
                
                <textarea placeholder="Description..." className="w-full p-4 bg-gray-50 rounded-lg ring-1 ring-gray-200 h-24" 
                  value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
                
                <div className="space-y-2">
                  {form.image && (
                    <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden border-2 border-emerald-50">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm({...form, image: ''})} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                  )}
                  <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} 
                    className="w-full p-4 border-2 border-dashed border-gray-200 rounded-lg hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <ArrowUpTrayIcon className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                  <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={async (e) => {
                       if(e.target.files?.[0]) {
                         const url = await handleUpload(e.target.files[0], 'livestock', setUploading);
                         if(url) setForm({...form, image: url});
                       }
                  }} />
                  <input placeholder="...or paste image URL here" className="w-full p-3 bg-gray-50 rounded-xl text-[10px] border-none ring-1 ring-gray-100 text-center uppercase font-bold tracking-tighter" 
                    value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
                </div>
                <button type="submit" disabled={loading || uploading} className="w-full py-4 bg-emerald-900 text-white font-bold rounded-lg transition-all active:scale-[0.98]">
                  {loading ? 'Saving...' : 'Save Livestock'}
                </button>
                {editId && <button onClick={() => {setEditId(null); setForm({breed:'', name:'', price:'', desc:'', specs:'', image:'', color:'bg-emerald-900'})}} className="w-full mt-2 text-gray-400 text-xs font-bold hover:text-red-500">Cancel Editing</button>}
              </form>
            </div>

            {/* Hero Settings ... (Same as before) */}
            <div className="bg-white rounded-lg shadow-sm border border-emerald-100 overflow-hidden">
              <button onClick={() => setIsHeroOpen(!isHeroOpen)} className="w-full p-4 md:px-8 flex items-center justify-between bg-white hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5 text-emerald-600"/>
                  <h3 className="font-black text-emerald-900 uppercase text-sm tracking-tight">Hero Settings</h3>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isHeroOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`transition-all duration-300 ${isHeroOpen ? 'max-h-[1000px] opacity-100 p-4 md:p-8 pt-0' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <input placeholder="Title" className="w-full p-3 bg-gray-50 rounded-lg border-none ring-1 ring-gray-200" value={header.title || ""} onChange={e => setHeader({...header, title: e.target.value})} />
                  <textarea placeholder="Subtitle" className="w-full p-3 bg-gray-50 rounded-lg border-none ring-1 ring-gray-200 h-20" value={header.subtitle || ""} onChange={e => setHeader({...header, subtitle: e.target.value})} />
                  
                  <div className="space-y-2">
                    {header.heroImage && (
                      <div className="w-full h-32 mb-4 rounded-lg overflow-hidden border border-gray-100">
                        <img src={header.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button type="button" disabled={uploadingHero} onClick={() => heroImageInputRef.current?.click()} 
                      className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-amber-50 disabled:opacity-50"
                    >
                      {uploadingHero ? 'Uploading...' : 'Upload Background File'}
                    </button>
                    <input type="file" hidden ref={heroImageInputRef} accept="image/*" onChange={async (e) => {
                         if(e.target.files?.[0]) {
                           const url = await handleUpload(e.target.files[0], 'settings', setUploadingHero);
                           if(url) setHeader({...header, heroImage: url});
                         }
                    }} />
                    <input placeholder="...or paste background URL here" className="w-full p-3 bg-gray-50 rounded-xl text-[10px] border-none ring-1 ring-gray-100 text-center uppercase font-bold tracking-tighter" 
                      value={header.heroImage || ""} onChange={e => setHeader({...header, heroImage: e.target.value})} />
                  </div>

                  <button onClick={() => {setDoc(doc(db, "settings", "livestockPage"), header); toast.success("Header saved")}} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md">
                    Update Hero
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl md:text-2xl font-black text-emerald-900 mb-4 px-2 tracking-tight">Live Catalog</h2>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {livestock.map(s => (
                  <div key={s.id} className='flex flex-col pt-2 pb-1 px-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all'>
                      <div className=" flex items-center justify-between">
                          <div className="flex items-center gap-2.5 md:gap-5">
                              <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-50">
                                  <img src={s.image} className="w-full h-full object-cover" alt={s.breed} />
                              </div>
                              <div className="flex flex-col">
                                  <span className={`w-fit text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white ${s.color}`}>{s.name}</span>
                                  <h4 className="font-black text-emerald-900 md:text-lg leading-tight mt-1">{s.breed}</h4>
                                  <p className="text-xs text-emerald-600 font-bold">₦{s.price?.toLocaleString()}</p>
                                  <p className="text-[8px] md:text-[10px] text-gray-400 font-bold mt-1 uppercase italic tracking-tighter">Specs: {s.specs || 'N/A'}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              {/* ✅ CORRECTED EDIT BUTTON */}
                              <button onClick={() => {
                                setForm({
                                  breed: s.breed || '',
                                  name: s.name || '', // This maps the old 'name' field to the new category dropdown
                                  price: s.price?.toString() || '',
                                  desc: s.desc || '',
                                  specs: s.specs || '',
                                  image: s.image || '',
                                  color: s.color || getColor(s.name)
                                }); 
                                setEditId(s.id); 
                                window.scrollTo({top:0, behavior:'smooth'})
                              }} className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-600 hover:text-white">
                                <PencilSquareIcon className="w-4 h-4"/>
                              </button>
                              <button onClick={() => handleDelete(s)} className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-600 hover:text-white"><TrashIcon className="w-4 h-4"/></button>
                          </div>
                      </div>
                      
                      <div className="mt-1 flex items-center justify-between border-t border-gray-50 pt-1">
                          <div className="flex items-center gap-1 text-[7px] md:text-[9px] text-gray-400 font-bold bg-gray-50 w-fit rounded-md px-1.5 py-0.5">
                              <UserCircleIcon className="w-3 h-3" />
                              <span>Added by: {s.addedBy || 'System'}</span>
                          </div>

                          {s.updatedAt && (
                            <div className="flex items-center gap-1 text-[7px] md:text-[9px] text-gray-400 font-bold">
                                <CalendarIcon className="w-3 h-3" />
                                <span>Updated: {s.updatedAt?.toDate().toLocaleDateString()}</span>
                            </div>
                          )}
                      </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}