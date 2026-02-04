'use client'
import { useState, useEffect, useRef } from 'react'
import { db, storage } from '@/lib/firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, onSnapshot, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon, PhotoIcon, PencilIcon, CheckCircleIcon, 
  PlusIcon, XMarkIcon, SparklesIcon, VideoCameraIcon, ArrowUpTrayIcon, MapPinIcon, PhoneIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function HomeDashboard() {
  const router = useRouter()
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [livestock, setLivestock] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  
  // Hero Content State
  const [hero, setHero] = useState({
    badge: '🎯 Trusted Since 1995',
    mainTitle: 'FarmFresh',
    rotatingTexts: ["Premium Quality", "Ethically Raised", "Sustainable Farming", "Natural Diet"],
    description: 'Experience the difference of animals raised with care, compassion, and sustainable practices. Your trusted source for premium livestock.',
    tourVideoUrl: '', 
    livestockBadge: '🐖 Our Premium Livestock',
    livestockTitle: 'Quality Animals, Ethical Farming',
    livestockDesc: 'Each animal is raised with care, ensuring they live healthy, stress-free lives in natural environments.',
    stats: [
      { value: '25+', label: 'Years', icon: '🏆' },
      { value: '10K+', label: 'Animals', icon: '🐄' },
      { value: '100%', label: 'Natural', icon: '🌿' }
    ],
    gridImages: [
        'https://www.nairaland.com/attachments/19387532_1751044648166_jpegd849c07b2c7c20052b36e24b3ab03caa',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80',
        'https://images.squarespace-cdn.com/content/v1/62da63f9ec4d5d07d12a1056/bb963dc5-8e82-41a6-af98-ab4b26c5c289/20220518154718_IMG_5042.jpg'
    ]
  })

  // ✅ NEW: Specific state for Public Address and Phone
  const [publicContact, setPublicContact] = useState({
    address: '',
    displayPhone: '' 
  })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "livestock"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedDocs = docs.sort((a: any, b: any) => {
        const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setLivestock(sortedDocs);
    })

    // Fetch Hero
    getDoc(doc(db, "settings", "homepage")).then(d => d.exists() && setHero(d.data() as any))
    
    // ✅ NEW: Fetch the Public Contact settings from its own document
    getDoc(doc(db, "settings", "contact")).then(d => {
      if(d.exists()) setPublicContact({
        address: d.data().address || '',
        displayPhone: d.data().publicDisplayPhone || '' 
      })
    })

    return () => unsub()
  }, [])

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true)
    const tId = toast.loading("Uploading tour video...")
    try {
      const storageRef = ref(storage, `videos/tour_${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setHero({ ...hero, tourVideoUrl: url })
      toast.success("Video uploaded!", { id: tId })
    } catch (e) { toast.error("Upload failed") }
    setUploadingVideo(false)
  }

  const saveHero = async () => {
    setLoading(true)
    const tId = toast.loading("Updating website...")
    try {
      // Save Homepage Content
      await setDoc(doc(db, "settings", "homepage"), hero, { merge: true })
      
      // ✅ Save Public Address & Phone (Safe field name)
      await setDoc(doc(db, "settings", "contact"), {
        address: publicContact.address,
        publicDisplayPhone: publicContact.displayPhone,
        updatedAt: serverTimestamp()
      }, { merge: true })

      toast.success("All changes published!", { id: tId })
    } catch (e: any) { 
      toast.error(`Save failed: ${e.message}`, { id: tId }) 
    }
    setLoading(false)
  }

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const featuredCount = livestock.filter(l => l.isFeatured).length
    if (!currentStatus && featuredCount >= 3) {
      return toast.error("Limit: Only 3 cards allowed on home.")
    }
    try {
      await updateDoc(doc(db, "livestock", id), { isFeatured: !currentStatus })
    } catch (e) { toast.error("Update failed") }
  }

  const addFeature = async (id: string, currentFeatures: string[], newFeature: string) => {
    if (!newFeature.trim()) return
    await updateDoc(doc(db, "livestock", id), { features: [...(currentFeatures || []), newFeature] })
  }

  const removeFeature = async (id: string, currentFeatures: string[], index: number) => {
    await updateDoc(doc(db, "livestock", id), { features: currentFeatures.filter((_, i) => i !== index) })
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-3 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-bold mb-6 transition-colors group"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">Home Content Editor</h1>
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Manage Global Landing Page</p>
          </div>
          <button onClick={saveHero} disabled={loading} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all text-sm sm:text-base w-full md:w-auto">
            {loading ? 'Saving...' : 'Publish All Changes'}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
          
          <div className="space-y-6">
            {/* ✅ NEW: GLOBAL OFFICE CONTACT SECTION */}
            <div className="bg-white px-3 py-5 sm:p-6 rounded-lg sm:rounded-[2.5rem] border border-emerald-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-black text-emerald-900 mb-4 sm:mb-6 flex items-center gap-2"><MapPinIcon className="w-5 h-5" /> Public Office Details</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-1">
                  <MapPinIcon className="mt-4 w-5 h-5 text-emerald-600" />
                  <textarea 
                    className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl border-none ring-1 ring-gray-100 text-sm h-20" 
                    placeholder="Update Office/Farm Address..." 
                    value={publicContact.address} 
                    onChange={e => setPublicContact({...publicContact, address: e.target.value})} 
                  />
                </div>
                <div className="flex">
                  <PhoneIcon className="mt-3 mr-2 w-5 h-5 text-emerald-600" />
                  <input 
                    className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl border-none ring-1 ring-gray-100 text-sm font-bold" 
                    placeholder="Website Display Phone (e.g. +234...)" 
                    value={publicContact.displayPhone} 
                    onChange={e => setPublicContact({...publicContact, displayPhone: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* HERO CONTENT SECTION */}
            <div className="bg-white px-3 py-5 sm:p-6 rounded-lg sm:rounded-[2.5rem] border border-emerald-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-black text-emerald-900 mb-4 sm:mb-6 flex items-center gap-2"><PencilIcon className="w-5 h-5" /> Hero Content</h2>
              <div className="space-y-3 sm:space-y-4">
                <input className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none ring-1 ring-gray-100 text-sm sm:text-base" placeholder="Badge" value={hero.badge} onChange={e => setHero({...hero, badge: e.target.value})} />
                <input className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none ring-1 ring-gray-100 font-bold text-sm sm:text-base" placeholder="Main Title" value={hero.mainTitle} onChange={e => setHero({...hero, mainTitle: e.target.value})} />
                <textarea className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none ring-1 ring-gray-100 h-20 sm:h-24 text-sm sm:text-base" placeholder="Rotating Texts (Comma separated)" value={hero.rotatingTexts.join(', ')} onChange={e => setHero({...hero, rotatingTexts: e.target.value.split(', ')})} />
                <textarea className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none ring-1 ring-gray-100 h-20 sm:h-24 text-sm sm:text-base" placeholder="Description" value={hero.description} onChange={e => setHero({...hero, description: e.target.value})} />
              </div>
            </div>

            {/* HERO STATS SECTION */}
            <div className="bg-white px-3 py-5 sm:p-6 rounded-lg sm:rounded-[2.5rem] border border-emerald-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-black text-emerald-900 mb-4 sm:mb-6 flex items-center gap-2">🏆 Experience Stats</h2>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {hero.stats.map((stat, i) => (
                  <div key={i} className="flex gap-2 bg-gray-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                    <input className="w-8 md:w-10 sm:w-12 text-center bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-sm" value={stat.icon} onChange={e => {
                      const ns = [...hero.stats]; ns[i].icon = e.target.value; setHero({...hero, stats: ns})
                    }} />
                    <input className="w-15 md:w-20 sm:w-24 font-bold bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-sm" value={stat.value} onChange={e => {
                      const ns = [...hero.stats]; ns[i].value = e.target.value; setHero({...hero, stats: ns})
                    }} />
                    <input className="w-full flex-1 bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-sm" value={stat.label} onChange={e => {
                      const ns = [...hero.stats]; ns[i].label = e.target.value; setHero({...hero, stats: ns})
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             {/* VIDEO & LIVESTOCK HEADER */}
             <div className="bg-white px-3 py-5 sm:p-6 rounded-lg sm:rounded-[2.5rem] border border-emerald-100 shadow-sm">
              <h2 className="text-lg sm:text-xl font-black text-emerald-900 mb-4 flex items-center gap-2"><VideoCameraIcon className="w-5 h-5" /> Video & Sections</h2>
              <div className="space-y-3 mb-4 sm:mb-6">
                <button type="button" onClick={() => videoInputRef.current?.click()} className="w-full p-3 sm:p-4 border-2 border-dashed border-gray-200 rounded-xl sm:rounded-2xl hover:bg-emerald-50 flex items-center justify-center gap-2 text-xs sm:text-sm">
                  <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  <span className="font-bold">{uploadingVideo ? 'Uploading...' : 'Upload Video File'}</span>
                </button>
                <input type="file" hidden ref={videoInputRef} accept="video/*" onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])} />
                
                {hero.tourVideoUrl && (
                  <div className="relative mt-3 sm:mt-4 group">
                    <video 
                      src={hero.tourVideoUrl} 
                      className="w-full h-40 sm:h-48 object-cover rounded-xl sm:rounded-2xl shadow-md"
                      controls
                    />
                    <button 
                      onClick={() => setHero({...hero, tourVideoUrl: ''})}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}

                <input placeholder="...or paste Video URL here" className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none ring-1 ring-gray-100 text-center text-xs" value={hero.tourVideoUrl} onChange={e => setHero({...hero, tourVideoUrl: e.target.value})} />
              </div>
              <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-gray-50">
                <input className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none ring-1 ring-gray-100 text-sm" placeholder="Livestock Badge" value={hero.livestockBadge} onChange={e => setHero({...hero, livestockBadge: e.target.value})} />
                <input className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none ring-1 ring-gray-100 font-bold text-sm" placeholder="Livestock Title" value={hero.livestockTitle} onChange={e => setHero({...hero, livestockTitle: e.target.value})} />
                <textarea className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-none ring-1 ring-gray-100 h-20 sm:h-24 text-sm" placeholder="Livestock Desc" value={hero.livestockDesc} onChange={e => setHero({...hero, livestockDesc: e.target.value})} />
              </div>
            </div>

             {/* HERO GRID IMAGES */}
             <div className="bg-white px-3 py-5 sm:p-6 rounded-lg sm:rounded-[2.5rem] border border-emerald-100 shadow-sm">
                <h2 className="text-lg sm:text-xl font-black text-emerald-900 mb-4 flex items-center gap-2"><PhotoIcon className="w-5 h-5" /> Hero Grid Images</h2>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {hero.gridImages.map((img, i) => (
                    <div key={i} className="space-y-1.5 sm:space-y-2">
                       <img src={img || 'https://placehold.co/400'} className="h-20 sm:h-24 w-full object-cover object-top rounded-lg sm:rounded-xl" />
                       <input className="w-full p-1.5 sm:p-2 bg-gray-50 rounded-lg text-[10px] sm:text-[10px]" placeholder={`Image ${i+1} URL`} value={img} onChange={e => {
                         const ni = [...hero.gridImages]; ni[i] = e.target.value; setHero({...hero, gridImages: ni})
                       }} />
                    </div>
                  ))}
                </div>
             </div>

             {/* FEATURED SELECTION */}
             <div className="sticky top-28">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-1 sm:px-2 gap-2 sm:gap-0">
                   <h2 className="text-lg sm:text-xl font-black text-emerald-900 uppercase">Feature on Home (3 Max)</h2>
                   <span className={`text-[10px] font-black px-2 sm:px-3 py-1 rounded-full border ${livestock.filter(l => l.isFeatured).length >= 3 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} self-start sm:self-auto`}>
                     {livestock.filter(l => l.isFeatured).length} / 3 SELECTED
                   </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-[50vh] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {livestock.map((animal) => (
                    <div key={animal.id} className={`p-3 sm:p-4 rounded-lg sm:rounded-lg border transition-all ${animal.isFeatured ? 'bg-emerald-50 border-emerald-300 shadow-md' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                         <div className="flex gap-2 sm:gap-4 min-w-0 flex-1">
                            <img src={animal.image} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover object-top flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-xs sm:text-sm text-emerald-900 truncate">{animal.breed}</h3>
                              <p className="text-[9px] sm:text-[10px] text-gray-400 line-clamp-1 italic truncate">{animal.desc}</p>
                            </div>
                         </div>
                         <input type="checkbox" checked={animal.isFeatured || false} onChange={() => toggleFeatured(animal.id, animal.isFeatured)} className="w-4 h-4 sm:w-5 sm:h-5 rounded-md text-emerald-600 flex-shrink-0 ml-1 sm:ml-2" />
                      </div>
                      <div className="border-t border-emerald-100 pt-2 sm:pt-3">
                        <div className="flex flex-wrap gap-1 mb-2 overflow-hidden">
                           {animal.features?.map((f: string, idx: number) => (
                             <span key={idx} className="bg-emerald-100 text-emerald-700 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black flex items-center gap-0.5 sm:gap-1 max-w-full truncate">
                               <span className="truncate">{f}</span>
                               <button onClick={() => removeFeature(animal.id, animal.features, idx)}>
                                 <XMarkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0"/>
                               </button>
                             </span>
                           ))}
                        </div>
                        <input placeholder="Add tag + Enter" className="text-[10px] p-1.5 sm:p-2 w-full bg-white border border-emerald-100 rounded-lg outline-none" onKeyDown={(e: any) => { if(e.key === 'Enter') { addFeature(animal.id, animal.features, e.currentTarget.value); e.currentTarget.value = '' } }} />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}