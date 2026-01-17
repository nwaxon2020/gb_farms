// app/livestock/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebaseConfig'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import LivestockHero from "@/components/livestock/LivestockHero"
import LivestockCard from "@/components/livestock/LivestockCard"
import PlaceOrderModal from "@/components/livestock/PlaceOrderModal" 
import toast from 'react-hot-toast'

export default function Page() {
  const [user] = useAuthState(auth)
  const [livestock, setLivestock] = useState<any[]>([])
  const [header, setHeader] = useState({ title: '', subtitle: '', heroImage: '' })
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedInfo, setSelectedInfo] = useState('')
  const [selectedPrice, setSelectedPrice] = useState(0) // ✅ Added state for numeric price

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

  const handleOpenOrder = (animal: any) => {
    if (!user) return toast.error("Please Sign In to order");
    
    // ✅ Keep details as a descriptive string only
    const info = `${animal.breed} (${animal.specs})`;
    
    setSelectedInfo(info);
    setSelectedPrice(animal.price); // ✅ Store the numeric price separately
    setModalOpen(true);
  }

  useEffect(() => {
      window.scrollTo(0, 0);
  }, []);

  if (loading) return null;

  return (
    <main className="bg-emerald-50/30 min-h-screen pb-20">
      <LivestockHero 
        title={header.title} 
        subtitle={header.subtitle} 
        imageUrl={header.heroImage} 
      />
      
      <div className="max-w-[1400px] mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {livestock.map((s) => (
            <LivestockCard 
              key={s.id} 
              {...s} 
              onOrder={() => handleOpenOrder(s)} 
            />
          ))}
        </div>
        
        {livestock.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-emerald-100 shadow-sm">
            <p className="text-gray-400 font-bold italic">Our catalog is being updated. Check back shortly!</p>
          </div>
        )}
      </div>

      {/* ✅ Pass both the string and the clean numeric price */}
      <PlaceOrderModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        animalDetails={selectedInfo}
        price={selectedPrice} 
      />
    </main>
  );
}