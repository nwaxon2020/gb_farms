'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthState } from 'react-firebase-hooks/auth'
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { Bars3Icon, XMarkIcon, ArrowRightStartOnRectangleIcon, ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ChevronDown } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user] = useAuthState(auth)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileName, setProfileName] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  // ✅ Live Search Logic (Filters as user types)
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      router.push(`/livestock?search=${encodeURIComponent(searchQuery.trim())}`);
    } else if (searchQuery === '' && pathname === '/livestock') {
      router.push('/livestock'); 
    }
  }, [searchQuery, router, pathname]);

  // ✅ Role & Name Verification (CEO vs Staff)
  useEffect(() => {
    const checkAdminStatus = async () => {
      const CEO_ID = process.env.NEXT_PUBLIC_ADMIN_ID;
      if (!user) { setIsAdmin(false); setProfileName(''); return; }
      
      if (user.uid === CEO_ID) {
        setIsAdmin(true);
        setProfileName('CEO');
      } else {
        // Fetch staff name from database
        const staffDoc = await getDoc(doc(db, "adminStaff", user.uid));
        if (staffDoc.exists() && staffDoc.data().role === 'Admin') {
          setIsAdmin(true);
          setProfileName(staffDoc.data().name || 'Staff');
        } else {
          setIsAdmin(false);
          setProfileName(user.displayName?.split(' ')[0] || 'User');
        }
      }
    };
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      setIsOpen(false)
    } catch (error) {
      console.error("Sign in error", error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setUserMenuOpen(false)
      setIsOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Livestock', href: '/livestock' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/#chat' },
  ]

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg py-3' : 'bg-white/95 backdrop-blur-sm py-4'}`}>
      <div className="mx-auto px-2 md:px-4">
        <div className="flex justify-between items-center">
          
          {/* Logo (Original) */}
          <Link href="/" className="flex items-center space-x-1 md:space-x-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <img src="/site_logo.png" alt="site logo" />
            </div>
            <div className="flex flex-col items-start font-sans">
              {/* Main Brand Name */}
              <h1 className="text-[9px] md:text-[18px] font-black text-gray-900 tracking-tight leading-none">
                OBAAS <span className="font-medium text-gray-700">Emmanuel Consult</span>
              </h1>

              {/* Decorative Separator Line */}
              <div className="w-full h-[1px] bg-gray-300 my-1" />

              {/* Tagline / Subtitle */}
              <p className="text-[6.5px] md:text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase flex justify-between w-full px-0.5">
                <span>Strategy</span>
                <span className="text-gray-300">|</span>
                <span>Innovation</span>
                <span className="text-gray-300">|</span>
                <span>Growth</span>
              </p>
            </div>
          </Link>

          {/* Desktop Search (New Logic, Vibrant UI) */}
          <div className="hidden md:flex flex-1 justify-center max-w-sm mx-4">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Search breed or category..." 
                className="w-full bg-green-100 border-2 border-green-200 rounded-full py-2 px-10 text-xs focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all outline-none font-bold text-green-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-green-600 absolute left-4 top-2.5" />
            </div>
          </div>

          {/* Desktop Navigation (Original Links) */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="relative text-gray-700 hover:text-green-600 font-medium transition-colors group">
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
            
            {user ? (
              <div className="relative flex items-center">
                {/* Desktop Profile Button (Original Style) */}
                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => isAdmin ? router.push('/admin') : setUserMenuOpen(!userMenuOpen)} 
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <img 
                      src={isAdmin ? `https://ui-avatars.com/api/?name=${profileName}&background=D4AF37&color=fff` : (user.photoURL || `https://ui-avatars.com/api/?name=${profileName}&background=10B981&color=fff`)} 
                      alt="User" className={`w-8 h-8 rounded-full border-2 ${isAdmin ? 'border-amber-400' : 'border-green-100'}`} 
                    />
                    <div className="text-left text-sm font-bold">
                      <span className={isAdmin ? 'text-amber-600' : 'text-gray-900'}>{profileName}</span>
                    </div>
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }} 
                    className="px-2 py-3 hover:bg-gray-200 border-l border-gray-200 transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logged in as</p>
                      <p className="text-xs font-bold text-gray-700 truncate">{user.email}</p>
                    </div>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center space-x-3 w-full px-4 py-2 text-amber-700 hover:bg-amber-50 font-semibold">
                        <ShieldCheckIcon className="w-5 h-5" /><span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 hover:bg-red-50">
                      <ArrowRightStartOnRectangleIcon className="w-5 h-5" /><span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleGoogleSignIn} className="bg-green-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-green-700 transition-all">Sign In</button>
            )}
          </div>

          {/* Mobile Header: Profile & Menu Trigger (Original) */}
          <div className="flex md:hidden items-center space-x-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-green-600 active:scale-90 transition-transform">
               <MagnifyingGlassIcon className="w-6 h-6" />
            </button>

            {user && (
              <button 
                onClick={() => isAdmin ? router.push('/admin') : setIsOpen(!isOpen)}
                className={`flex items-center space-x-1.5 py-1 px-1.5 rounded-full shadow-sm transition-all duration-300 active:scale-95 ${isAdmin ? 'bg-amber-50 shadow-amber-100/50' : 'bg-green-50 shadow-green-100/50'}`}
              >
                <img 
                  src={isAdmin ? `https://ui-avatars.com/api/?name=${profileName}&background=D4AF37&color=fff` : (user.photoURL || `https://ui-avatars.com/api/?name=${profileName}&background=10B981&color=fff`)} 
                  className="w-5 h-5 rounded-full" 
                  alt="Profile" 
                />
                <span className={`text-[9px] font-black tracking-tight ${isAdmin ? 'text-amber-700' : 'text-green-800'}`}>
                  {profileName.toUpperCase()}
                </span>
              </button>
            )}

            <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Section (Vibrant Green) */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${searchOpen ? 'max-h-24 mt-3 pb-2' : 'max-h-0'}`}>
           <div className="relative">
              <input 
                autoFocus
                type="text" 
                placeholder="Search livestock..." 
                className="w-full bg-green-200/60 rounded-2xl py-4 px-12 text-sm border-none outline-none font-bold text-green-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <MagnifyingGlassIcon className="w-6 h-6 text-green-700 absolute left-4 top-3.5" />
           </div>
        </div>

        {/* Mobile Menu Dropdown (Original) */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 space-y-4">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="block bg-green-50 text-gray-700 font-medium py-3 px-4 rounded-xl hover:bg-green-100 transition-all" onClick={() => setIsOpen(false)}>{link.name}</Link>
            ))}
            
            {user ? (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl ${isAdmin ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <img src={isAdmin ? `https://ui-avatars.com/api/?name=${profileName}&background=D4AF37&color=fff` : (user.photoURL || `https://ui-avatars.com/api/?name=${profileName}&background=10B981&color=fff`)} className="w-10 h-10 rounded-full" alt="Profile" />
                  <div>
                    <span className={`font-bold block ${isAdmin ? 'text-amber-700' : 'text-gray-900'}`}>{profileName}</span>
                    <span className="text-[10px] text-gray-500">{user.email}</span>
                  </div>
                </div>

                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsOpen(false)} className="w-full text-left px-4 py-3 text-amber-700 bg-amber-50 rounded-xl flex items-center gap-2 font-bold">
                    <ShieldCheckIcon className="w-5 h-5" />Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-600 bg-red-50 rounded-xl flex items-center gap-2 font-bold">
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5" />Sign Out
                </button>
              </div>
            ) : (
              <button onClick={handleGoogleSignIn} className="w-full bg-green-600 text-white font-medium py-3 rounded-xl">Sign In with Google</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar