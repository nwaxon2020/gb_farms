'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebaseConfig'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import LivestockHero from "@/components/livestock/LivestockHero"
import LivestockCard from "@/components/livestock/LivestockCard"
import PlaceOrderModal from "@/components/livestock/PlaceOrderModal" 
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function LivestockContent() {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search')?.toLowerCase().trim() || ''
  
  const [livestock, setLivestock] = useState<any[]>([])
  const [header, setHeader] = useState({ title: '', subtitle: '', heroImage: '' })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedInfo, setSelectedInfo] = useState('')
  const [selectedPrice, setSelectedPrice] = useState(0)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "livestock"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedDocs = docs.sort((a: any, b: any) => {
        const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setLivestock(sortedDocs);
      setLoading(false);
    })
    getDoc(doc(db, "settings", "livestockPage")).then(d => {
      if(d.exists()) setHeader(d.data() as any);
    })
    return () => unsub();
  }, [])

  // ✅ Multi-Field Filtering (Category name & Breed)
  const filteredLivestock = livestock.filter(animal => {
    if (!searchQuery) return true;
    return (
      animal.name?.toLowerCase().includes(searchQuery) ||    
      animal.breed?.toLowerCase().includes(searchQuery) ||   
      animal.specs?.toLowerCase().includes(searchQuery)      
    );
  })

  const handleOpenOrder = (animal: any) => {
    if (!user) return toast.error("Please Sign In to order");
    setSelectedInfo(`${animal.breed} (${animal.specs})`);
    setSelectedPrice(animal.price);
    setModalOpen(true);
  }

  if (loading) return null;

  return (
    <main className="bg-emerald-50/30 min-h-screen pb-20">
      <LivestockHero title={header.title} subtitle={header.subtitle} imageUrl={header.heroImage} />
      
      <div className="max-w-[1400px] mx-auto px-6 -mt-12 relative z-20">
        {searchQuery && (
          <div className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top duration-500">
             <div className="bg-white/90 backdrop-blur-md py-4 px-8 rounded-[2rem] shadow-xl border border-emerald-100 flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-emerald-900 font-black text-xs uppercase tracking-tighter">
                  Results for: <span className="text-emerald-600">"{searchQuery}"</span>
                </p>
             </div>
             <button onClick={() => router.push('/livestock')} className="bg-white p-4 rounded-full shadow-lg text-gray-400 hover:text-red-500 transition-colors">
                <XMarkIcon className="w-5 h-5" />
             </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLivestock.map((s) => (
            <LivestockCard key={s.id} {...s} onOrder={() => handleOpenOrder(s)} />
          ))}
        </div>
        
        {filteredLivestock.length === 0 && (
          <div className="bg-white rounded-[3rem] p-16 md:p-32 text-center border-2 border-dashed border-emerald-100 mt-8 animate-in zoom-in duration-500">
            <MagnifyingGlassIcon className="w-16 h-16 text-emerald-100 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-emerald-900 mb-2 tracking-tighter uppercase">No results found</h2>
            <p className="text-gray-400 font-bold max-w-sm mx-auto leading-relaxed mb-10 italic">
              "We couldn't find any category or breed matching <span className="text-emerald-600">'{searchQuery}'</span>."
            </p>
            <button onClick={() => router.push('/livestock')} className="px-12 py-5 bg-emerald-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl">
                Browse Full Catalog
            </button>
          </div>
        )}
      </div>

      <PlaceOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} animalDetails={selectedInfo} price={selectedPrice} />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LivestockContent />
    </Suspense>
  )
}