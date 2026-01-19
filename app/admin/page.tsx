'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { 
  ShoppingBagIcon, 
  UsersIcon, 
  ShieldCheckIcon, 
  ArrowRightStartOnRectangleIcon, 
  ArrowRightIcon,
  RectangleGroupIcon,
  PaintBrushIcon,
  ScaleIcon,
  CircleStackIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const AdminDashboard = () => {
  const [user, loading] = useAuthState(auth)
  const [isVerified, setIsVerified] = useState(false)
  const [checkingDb, setCheckingDb] = useState(true)
  const router = useRouter()
  
  const CEO_ID = process.env.NEXT_PUBLIC_ADMIN_ID
  const isCEO = user?.uid === CEO_ID

 useEffect(() => {
  const verify = async () => {
    if (loading) return;
    if (!user) { router.push('/'); return; }

    const CEO_ID = process.env.NEXT_PUBLIC_ADMIN_ID;
    if (user.uid === CEO_ID) { setIsVerified(true); setCheckingDb(false); return; }

    // Check provider
    const usedPassword = user.providerData.some(p => p.providerId === 'password');
    if (!usedPassword) { router.push('/'); return; }

    // Check DB
    const q = query(collection(db, "adminStaff"), where("email", "==", user.email?.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty) { setIsVerified(true); } else { router.push('/'); }
    setCheckingDb(false);
  };
  verify();
}, [user, loading]);

  if (loading || checkingDb) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest animate-pulse">
          Securing Environment...
        </p>
      </div>
    )
  }

  if (!isVerified) return null

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white rounded-xl md:rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-2xl flex items-center justify-center shadow-inner ${isCEO ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <ShieldCheckIcon className={`w-10 h-10 ${isCEO ? 'text-amber-600' : 'text-emerald-600'}`} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {isCEO ? 'CEO Control Center' : 'Admin Panel'}
              </h1>
              <p className={`${isCEO ? 'text-amber-600' : 'text-emerald-600'} font-bold text-xs uppercase tracking-widest flex items-center gap-1`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                {isCEO ? 'Master Access' : 'Staff Access'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="flex text-sm md:text-base items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-6 py-3 rounded-2xl transition-all border border-transparent hover:border-red-100"
          >
            <ArrowRightStartOnRectangleIcon className="w-5 h-5" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* ✅ 1. Bookkeeping & Inventory Card (Now First) */}
          <Link href="/admin/book-keeping" className="group">
            <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-emerald-600 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-100 h-full flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <CircleStackIcon className="w-8 h-8 md:w-12 md:h-12 text-emerald-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Book keeping</h2>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                Manage livestock categories, update stock quantities, process walk-in sales, and track daily revenue.
              </p>
              <div className="text-sm md:text-base mt-auto w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-black transition-colors shadow-lg shadow-emerald-100">
                <span>Manage Inventory</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Orders Card */}
          <Link href="/admin/orders" className="group">
            <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-emerald-500 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-100 h-full flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <ShoppingBagIcon className="w-8 h-8 md:w-12 md:h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Orders</h2>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                Monitor incoming livestock requests, update fulfillment status, and track customer deliveries.
              </p>
              <div className="text-sm md:text-base mt-auto w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                <span>View All Orders</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Manage Livestock Card */}
          <Link href="/admin/add-livestock" className="group">
            <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-100 h-full flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                <RectangleGroupIcon className="w-8 h-8 md:w-12 md:h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Livestock Catalog</h2>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                Update species, change pricing in Naira, and modify the public shop header text and video.
              </p>
              <div className="text-sm md:text mt-auto w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
                <span>Manage Catalog</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Home Appearance Card */}
          <Link href="/admin/home-dashboard" className="group">
            <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-100 h-full flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-24 h-24 bg-purple-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <PaintBrushIcon className="w-8 h-8 md:w-12 md:h-12 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Home Appearance</h2>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                Customize the main landing page, edit rotating text, update farm stats, and feature top animals.
              </p>
              <div className="text-sm md:text mt-auto w-full py-4 bg-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-purple-700 transition-colors shadow-lg shadow-purple-100">
                <span>Design Homepage</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* CEO ONLY: Admin Control */}
          {isCEO && (
            <Link href="/admin/manage-users" className="group">
              <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-amber-500 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-100 h-full flex flex-col items-center text-center relative overflow-hidden">
                <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <UsersIcon className="w-8 h-8 md:w-12 md:h-12 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Control</h2>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                  Authorize new staff members, revoke permissions, and manage the administrative team security.
                </p>
                <div className="text-sm md:text mt-auto w-full py-4 bg-amber-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-amber-600 transition-colors shadow-lg shadow-amber-100">
                  <span>Manage Staff</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}

          {/* CEO ONLY: Legal */}
          {isCEO && (
            <Link href="/admin/policy" className="group">
              <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-rose-500 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-100 h-full flex flex-col items-center text-center relative overflow-hidden">
                <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                  <ScaleIcon className="w-8 h-8 md:w-12 md:h-12 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal & Policies</h2>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                  Update the Terms & Conditions and Privacy Policy content that customers see on the live site.
                </p>
                <div className="text-sm md:text mt-auto w-full py-4 bg-rose-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100">
                  <span>Manage Legal</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard