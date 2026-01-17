'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth, storage } from '@/lib/firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { initializeApp, deleteApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { useAuthState } from 'react-firebase-hooks/auth'
import { collection, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, setDoc, where } from 'firebase/firestore'
import { UserPlusIcon, TrashIcon, ArrowLeftIcon, ShieldCheckIcon, PhoneIcon, AtSymbolIcon, PhotoIcon, PencilIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FaFacebookF, FaInstagram, FaTiktok, FaTwitter, FaYoutube } from 'react-icons/fa'
import toast from 'react-hot-toast'

const ManageStaff = () => {
  const [user, authLoading] = useAuthState(auth)
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [boilerMessage, setBoilerMessage] = useState('')
  const [socials, setSocials] = useState({ facebook: '', instagram: '', twitter: '', youtube: '', tiktok: '' })
  const [updatingSettings, setUpdatingSettings] = useState(false)

  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)

  const ceoInputRef = useRef<HTMLInputElement>(null)
  const teamInputRef = useRef<HTMLInputElement>(null)
  
  const [about, setAbout] = useState({
    heroTitle: 'Our Story of Passion & Purpose',
    heroSubtitle: 'Where Tradition Meets Innovation in Modern Farming',
    heroDescription: 'For over 25 years, we have been dedicated to redefining excellence in livestock farming...',
    mission: 'To revolutionize livestock farming...',
    vision: 'A world where every animal is raised with dignity...',
    ceoName: 'Johnathan O. Williams',
    ceoTitle: 'Founder & Chief Executive Officer',
    ceoImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    ceoQuote: 'True farming is not just a business...',
    ceoBio: 'With 25+ years in sustainable agriculture...',
    values: [
      { icon: '🌱', title: 'Sustainability', description: 'Regenerative practices' },
      { icon: '❤️', title: 'Animal Welfare', description: 'Stress-free environments' },
      { icon: '🤝', title: 'Community', description: 'Empowering local farmers' },
      { icon: '🔬', title: 'Innovation', description: 'Research driven' }
    ],
    milestones: [
      { year: '1995', title: 'Humble Beginnings', description: 'Started with just 5 acres' },
      { year: '2005', title: 'Expansion', description: 'Grew to 500-acre farm' },
      { year: '2015', title: 'Certification', description: 'Organic certified' },
      { year: '2023', title: 'Global Reach', description: 'Serving 3 continents' }
    ],
    teamImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80',
    stats: [
      { value: '25+', label: 'Years Experience' },
      { value: '5000+', label: 'Happy Clients' },
      { value: '100%', label: 'Natural Feed' },
      { value: '50+', label: 'Team Members' }
    ]
  })

  const [uploadingCEOImage, setUploadingCEOImage] = useState(false)
  const [uploadingTeamImage, setUploadingTeamImage] = useState(false)

  const router = useRouter()
  const CEO_ID = process.env.NEXT_PUBLIC_ADMIN_ID

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.uid !== CEO_ID) {
        router.push('/admin')
      } else {
        fetchAdmins()
        fetchSettings()
        fetchAboutContent()
      }
    }
  }, [user, authLoading])

  const fetchAdmins = async () => {
    const q = query(collection(db, "adminStaff"), orderBy("addedAt", "desc"))
    const querySnapshot = await getDocs(q)
    setAdmins(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  }

  const fetchSettings = async () => {
    const docSnap = await getDoc(doc(db, "settings", "contact"))
    if (docSnap.exists()) {
      const data = docSnap.data()
      setContactPhone(data.phoneNumber || '')
      setContactEmail(data.email || '')
      setBoilerMessage(data.boilerMessage || '')
      setSocials({
        facebook: data.facebook || '', instagram: data.instagram || '',
        twitter: data.twitter || '', youtube: data.youtube || '', tiktok: data.tiktok || ''
      })
    }
  }

  const fetchAboutContent = async () => {
    const docSnap = await getDoc(doc(db, "settings", "about"))
    if (docSnap.exists()) setAbout(docSnap.data() as any)
  }

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingSettings(true)
    const tId = toast.loading("Updating global settings...")
    try {
      await setDoc(doc(db, "settings", "contact"), {
        phoneNumber: contactPhone, email: contactEmail, boilerMessage,
        ...socials, updatedAt: serverTimestamp()
      }, { merge: true })
      toast.success("Settings synced!", { id: tId })
    } catch (e) { toast.error("Failed", { id: tId }) }
    finally { setUpdatingSettings(false) }
  }

  const saveAboutContent = async () => {
    const tId = toast.loading("Updating About Page...")
    try {
      await setDoc(doc(db, "settings", "about"), { ...about, updatedAt: serverTimestamp() }, { merge: true })
      toast.success("About Page Live!", { id: tId })
    } catch (e) { toast.error("Failed", { id: tId }) }
  }

  // ✅ LOGIC UPDATED: Now uses "settings/about" folder to match your storage rules
  const handleImageUpload = async (file: File, type: 'ceo' | 'team') => {
    const setStatus = type === 'ceo' ? setUploadingCEOImage : setUploadingTeamImage;
    setStatus(true)
    const tId = toast.loading(`Uploading ${type} image...`)
    
    try {
      // 1. Storage Reference (using settings/about path)
      const storageRef = ref(storage, `settings/about/${type}_${Date.now()}`)
      
      // 2. Upload Bytes
      const uploadResult = await uploadBytes(storageRef, file)
      
      // 3. Get the real HTTPS URL
      const permanentUrl = await getDownloadURL(uploadResult.ref)
      
      // 4. Update state with permanent URL
      setAbout(prev => ({ ...prev, [type === 'ceo' ? 'ceoImage' : 'teamImage']: permanentUrl }))
      toast.success("Uploaded successfully!", { id: tId })
    } catch (e) { 
      toast.error("Error uploading image", { id: tId }) 
    } finally {
      setStatus(false)
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    const toastId = toast.loading('Syncing...')
    setLoading(true)
    try {
      const checkQuery = query(collection(db, "adminStaff"), where("email", "==", email.toLowerCase().trim()))
      const checkSnap = await getDocs(checkQuery)
      if (!checkSnap.empty) {
        toast.error("Email exists", { id: toastId })
        setLoading(false); return;
      }
      const firebaseConfig = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }
      const secondaryApp = getApps().find(app => app.name === "AdminFactory") || initializeApp(firebaseConfig, "AdminFactory")
      const secondaryAuth = getAuth(secondaryApp)
      let finalUid = "staff_linked"
      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
        finalUid = userCredential.user.uid
      } catch (authErr: any) { if (authErr.code !== 'auth/email-already-in-use') throw authErr; }
      await setDoc(doc(db, "adminStaff", email.toLowerCase().replace(/\./g, '_')), { uid: finalUid, email: email.toLowerCase().trim(), role: 'Admin', addedAt: serverTimestamp() })
      await deleteApp(secondaryApp)
      toast.success(`Staff added`, { id: toastId })
      setEmail(''); setPassword(''); fetchAdmins()
    } catch (err: any) { toast.error(err.message, { id: toastId }) }
    setLoading(false)
  }

  const removeAdmin = async (id: string, staffEmail: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-2">
        <p className="text-sm font-medium">Remove <span className="font-bold text-red-600">{staffEmail}</span>?</p>
        <div className="flex gap-2">
          <button onClick={async () => { toast.dismiss(t.id); await deleteDoc(doc(db, "adminStaff", id)); fetchAdmins() }} className="bg-red-600 text-white px-4 py-1 rounded-lg text-xs">Confirm</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 px-4 py-1 rounded-lg text-xs">Cancel</button>
        </div>
      </div>
    ))
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-3 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* CEO Identity Section with Glowing Image */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-12 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
            <img 
              src={about.ceoImage} 
              className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover shadow-2xl" 
              alt="CEO"
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Executive Management</h1>
            <p className="text-emerald-600 font-bold uppercase text-xs tracking-widest mt-1">Master Control: {user?.email}</p>
          </div>
        </div>

        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-bold mb-6 transition-colors group">
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                
                {/* 1. Add Staff (Always Visible) */}
                <div className="bg-white p-3 md:p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-amber-50 rounded-2xl"><UserPlusIcon className="w-6 h-6 text-amber-600" /></div>
                    <h2 className="text-lg font-bold text-gray-900">Add Staff</h2>
                  </div>
                  <form onSubmit={handleAddAdmin} className="space-y-3">
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="Staff Email" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="Password" />
                    <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg text-xs">Register Staff</button>
                  </form>
                </div>

                {/* 2. Global Contact (Collapsible on Mobile) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                   <button onClick={() => setIsContactOpen(!isContactOpen)} className="w-full p-4 md:p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-emerald-50 rounded-2xl"><ShieldCheckIcon className="w-6 h-6 text-emerald-600" /></div>
                         <h2 className="text-lg md:font-black font-bold text-gray-900">Global Contact Editor</h2>
                      </div>
                      <div className="md:hidden">{isContactOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}</div>
                   </button>
                   
                   <div className={`${isContactOpen ? 'block' : 'hidden'} md:block p-4 md:p-6 pt-0`}>
                      <form onSubmit={handleUpdateSettings} className="space-y-3">
                          <div className="relative group"><PhoneIcon className="w-4 h-4 absolute left-3.5 top-4 text-gray-400" /><input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="Phone Number" /></div>
                          <div className="relative group"><AtSymbolIcon className="w-4 h-4 absolute left-3.5 top-4 text-gray-400" /><input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="CEO Email" /></div>
                          <textarea value={boilerMessage} onChange={e => setBoilerMessage(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs h-20" placeholder="WhatsApp Message" />
                          <div className="grid grid-cols-1 gap-2">
                              <div className="flex gap-2"><div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg text-blue-600"><FaFacebookF/></div><input value={socials.facebook} onChange={e => setSocials({...socials, facebook: e.target.value})} className="px-2 flex-1 bg-gray-50 border-none text-[10px] rounded-lg" placeholder="Facebook" /></div>
                              <div className="flex gap-2"><div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg text-pink-600"><FaInstagram/></div><input value={socials.instagram} onChange={e => setSocials({...socials, instagram: e.target.value})} className="px-2 flex-1 bg-gray-50 border-none text-[10px] rounded-lg" placeholder="Instagram" /></div>
                              <div className="flex gap-2"><div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg text-black"><FaTiktok/></div><input value={socials.tiktok} onChange={e => setSocials({...socials, tiktok: e.target.value})} className="px-2 flex-1 bg-gray-50 border-none text-[10px] rounded-lg" placeholder="TikTok" /></div>
                          </div>
                          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 text-xs">Update Settings</button>
                      </form>
                   </div>
                </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
                {/* Team List (Restored Original Style) */}
                <div className="hidden md:block bg-white max-h-[500px] overflow-y-auto p-3 md:p-8 rounded-lg shadow-sm border border-gray-100">
                   <div className="flex items-center justify-between mb-6 ml-2">
                      <h2 className="md:text-xl font-black text-gray-900 uppercase">Authorized Team</h2>
                      <span className="text-[10px] font-black text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">{admins.length} MEMBERS</span>
                   </div>
                   <div className="md:w-full grid grid-cols-1   gap-3">
                      {admins.map((admin) => (
                        <div key={admin.id} className="bg-white p-2 md:p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:border-amber-200 transition-all group">
                           <div className="flex items-center gap-2 md:gap-4">
                              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700 font-bold text-lg">{admin.email[0].toUpperCase()}</div>
                              <div>
                                 <p className="text-[10px] md:text-sm font-black text-gray-900 leading-tight">{admin.email}</p>
                                 <p className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">Access: Admin</p>
                              </div>
                           </div>
                           <button onClick={() => removeAdmin(admin.id, admin.email)} className="p-2 md:p-3 text-red-600 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-xl">
                              <TrashIcon className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
                
                {/* 3. About Page Editor (The Big Gray Section) */}
                <div className="bg-gray-100 p-4 md:p-8 rounded-lg border border-gray-200 shadow-inner">
                   <button onClick={() => setIsAboutOpen(!isAboutOpen)} className="w-full flex items-center justify-between md:mb-6 lg:mb-8">
                      <div className="flex items-center gap-3">
                         <div className="p-3 bg-white rounded-2xl shadow-sm"><PencilIcon className="w-6 h-6 text-purple-600" /></div>
                         <h2 className="text-lg md:font-black font-bold text-gray-900">About Page Editor</h2>
                      </div>
                      <div className="lg:hidden p-2 bg-white rounded-full shadow-sm">{isAboutOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}</div>
                   </button>

                   <div className={`${isAboutOpen ? 'pt-4 block' : 'hidden'} lg:block space-y-6`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Top Grid: Hero & Bio */}
                          <div className="bg-white px-3 py-4 rounded-lg border border-gray-200 space-y-3">
                             <p className="text-[10px] font-black text-purple-500 uppercase">Hero Section</p>
                             <input value={about.heroTitle} onChange={e => setAbout({...about, heroTitle: e.target.value})} className="w-full p-2 bg-gray-50 border-none rounded-md text-xs font-bold" placeholder="Title" />
                             <textarea value={about.heroDescription} onChange={e => setAbout({...about, heroDescription: e.target.value})} className="w-full p-2 bg-gray-50 border-none rounded-md text-xs h-24" placeholder="Description" />
                          </div>
                          
                          <div className="bg-white px-3 py-4 rounded-lg border border-gray-200 space-y-3">
                             <p className="text-[10px] font-black text-purple-500 uppercase">CEO Profile</p>
                             
                             <div className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg">
                                <img src={about.ceoImage} className="w-12 h-12 rounded-full object-cover border border-purple-100 shadow-sm" />
                                <button 
                                  onClick={() => ceoInputRef.current?.click()}
                                  className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-600 bg-white px-3 py-2 rounded-lg border border-purple-100 hover:bg-purple-50 transition-all"
                                >
                                  <ArrowUpTrayIcon className="w-3 h-3" /> {uploadingCEOImage ? '...' : 'CEO Image'}
                                </button>
                                <input type="file" ref={ceoInputRef} hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'ceo')} />
                             </div>

                             <input value={about.ceoName} onChange={e => setAbout({...about, ceoName: e.target.value})} className="w-full p-2 bg-gray-50 border-none rounded-md text-xs font-bold" placeholder="Name" />
                             <textarea value={about.ceoBio} onChange={e => setAbout({...about, ceoBio: e.target.value})} className="w-full p-2 bg-gray-50 border-none rounded-md text-xs h-12" placeholder="Bio" />
                          </div>
                      </div>

                      {/* Middle Grid: Core Values */}
                      <div className="bg-white px-3 py-4 rounded-lg border border-gray-200">
                         <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-purple-500 uppercase">Core Values & Team Image</p>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {about.values.map((v, i) => (
                                   <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                      <input value={v.icon} onChange={e => { const n = [...about.values]; n[i].icon = e.target.value; setAbout({...about, values: n}) }} className="w-8 text-center bg-white border-none rounded text-sm" />
                                      <input value={v.title} onChange={e => { const n = [...about.values]; n[i].title = e.target.value; setAbout({...about, values: n}) }} className="flex-1 bg-white border-none rounded p-1 text-xs" />
                                   </div>
                                ))}
                            </div>

                            <div className="md:col-span-4 space-y-2">
                                <div className="relative group rounded-xl overflow-hidden h-24 border border-gray-100">
                                   <img src={about.teamImage} className="w-full h-full object-cover" />
                                   <button 
                                      onClick={() => teamInputRef.current?.click()}
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                   >
                                      <ArrowUpTrayIcon className="w-6 h-6 text-white" />
                                   </button>
                                   <input type="file" ref={teamInputRef} hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'team')} />
                                </div>
                                <p className="text-[8px] text-center font-bold text-gray-400 uppercase tracking-widest">Update Team Image</p>
                            </div>
                         </div>
                      </div>

                      {/* Bottom Grid: Stats & Milestones */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white px-3 py-4 rounded-lg border border-gray-200">
                           <p className="text-[10px] font-black text-purple-500 uppercase mb-3">Live Stats</p>
                           <div className="grid grid-cols-2 gap-2">
                             {about.stats.map((s, i) => (
                               <div key={i} className="space-y-1">
                                  <input value={s.value} onChange={e => { const n = [...about.stats]; n[i].value = e.target.value; setAbout({...about, stats: n}) }} className="w-full p-1 bg-gray-50 rounded text-xs font-bold" />
                                  <input value={s.label} onChange={e => { const n = [...about.stats]; n[i].label = e.target.value; setAbout({...about, stats: n}) }} className="w-full p-1 bg-gray-50 rounded text-[10px]" />
                               </div>
                             ))}
                           </div>
                        </div>

                        <div className="bg-white px-3 py-4 rounded-lg border border-gray-100">
                           <p className="text-[10px] font-black text-purple-500 uppercase mb-3">Milestones</p>
                           <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                              {about.milestones.map((m, i) => (
                                <div key={i} className="flex gap-2">
                                   <input value={m.year} onChange={e => { const n = [...about.milestones]; n[i].year = e.target.value; setAbout({...about, milestones: n}) }} className="w-16 p-1 bg-gray-50 rounded text-[10px]" />
                                   <input value={m.title} onChange={e => { const n = [...about.milestones]; n[i].title = e.target.value; setAbout({...about, milestones: n}) }} className="flex-1 p-1 bg-gray-50 rounded text-[10px]" />
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>

                      <button onClick={saveAboutContent} className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold text-xs shadow-lg hover:bg-purple-700 flex items-center justify-center gap-2 transition-all">
                         <SparklesIcon className="w-5 h-5" /> Save About Changes
                      </button>
                   </div>
                </div>

                {/* Team List (Mobile) */}
                <div className="md:hidden bg-white max-h-[500px] overflow-y-auto p-3 md:p-8 rounded-lg shadow-sm border border-gray-100">
                   <div className="flex items-center justify-between mb-6 ml-2">
                      <h2 className="md:text-xl font-black text-gray-900 uppercase">Authorized Team</h2>
                      <span className="text-[10px] font-black text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">{admins.length} MEMBERS</span>
                   </div>
                   <div className="md:w-full grid grid-cols-1   gap-3">
                      {admins.map((admin) => (
                        <div key={admin.id} className="bg-white p-2 md:p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:border-amber-200 transition-all group">
                           <div className="flex items-center gap-2 md:gap-4">
                              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700 font-bold text-lg">{admin.email[0].toUpperCase()}</div>
                              <div>
                                 <p className="text-[10px] md:text-sm font-black text-gray-900 leading-tight">{admin.email}</p>
                                 <p className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">Access: Admin</p>
                              </div>
                           </div>
                           <button onClick={() => removeAdmin(admin.id, admin.email)} className="p-2 md:p-3 text-red-600 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-xl">
                              <TrashIcon className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
            </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
      `}</style>
    </div>
  )
}

export default ManageStaff;