'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthState } from 'react-firebase-hooks/auth'
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseConfig'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Bars3Icon, XMarkIcon, ArrowRightStartOnRectangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user] = useAuthState(auth)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      const CEO_ID = process.env.NEXT_PUBLIC_ADMIN_ID;
      if (!user) { setIsAdmin(false); return; }
      if (user.uid === CEO_ID) { setIsAdmin(true); return; }
      const usedPassword = user.providerData.some(p => p.providerId === 'password');
      if (usedPassword && user.email) {
        const q = query(collection(db, "adminStaff"), where("email", "==", user.email.toLowerCase()));
        const snap = await getDocs(q);
        setIsAdmin(!snap.empty);
      } else {
        setIsAdmin(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-xl md:text-2xl">F</span>
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-none">FarmFresh</h1>
              <p className="text-[10px] md:text-xs text-green-600 font-medium">Premium Livestock</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="relative text-gray-700 hover:text-green-600 font-medium transition-colors group">
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
            
            {user ? (
              <div className="relative flex items-center">
                {/* Desktop Profile Button */}
                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => isAdmin ? router.push('/admin') : setUserMenuOpen(!userMenuOpen)} 
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <img 
                      src={isAdmin ? 'https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=fff' : (user.photoURL || 'https://ui-avatars.com/api/?name=User&background=10B981&color=fff')} 
                      alt="User" className={`w-8 h-8 rounded-full border-2 ${isAdmin ? 'border-amber-400' : 'border-green-100'}`} 
                    />
                    <div className="text-left text-sm font-bold">
                      <span className={isAdmin ? 'text-amber-600' : 'text-gray-900'}>{isAdmin ? 'Admin' : (user.displayName?.split(' ')[0])}</span>
                    </div>
                  </button>

                  {/* Desktop Dropdown Arrow - Only handles Logout menu toggle */}
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
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center space-x-3 w-full px-4 py-2 text-amber-700 hover:bg-amber-50 font-semibold border-b border-gray-50">
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

          {/* Mobile Header: Profile & Menu Trigger */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <button 
                onClick={() => isAdmin ? router.push('/admin') : setIsOpen(!isOpen)}
                className={`flex items-center space-x-1.5 py-1 px-1.5 rounded-full shadow-sm transition-all duration-300 active:scale-95 ${isAdmin ? 'bg-amber-50 shadow-amber-100/50' : 'bg-green-50 shadow-green-100/50'}`}
              >
                <img 
                  src={isAdmin ? 'https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=fff' : (user.photoURL || 'https://ui-avatars.com/api/?name=User&background=10B981&color=fff')} 
                  className="w-5 h-5 rounded-full" 
                  alt="Profile" 
                />
                <span className={`text-[9px] font-black tracking-tight ${isAdmin ? 'text-amber-700' : 'text-green-800'}`}>
                  {isAdmin ? 'ADMIN' : (user.displayName?.split(' ')[0].toUpperCase())}
                </span>
              </button>
            )}

            <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
              {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 space-y-4">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="block bg-green-50 text-gray-700 font-medium py-3 px-4 rounded-xl hover:bg-green-100 transition-all" onClick={() => setIsOpen(false)}>{link.name}</Link>
            ))}
            
            {user ? (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl ${isAdmin ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <img src={isAdmin ? 'https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=fff' : (user.photoURL || 'https://ui-avatars.com/api/?name=User&background=10B981&color=fff')} className="w-10 h-10 rounded-full" alt="Profile" />
                  <span className={`font-bold ${isAdmin ? 'text-amber-700' : 'text-gray-900'}`}>{isAdmin ? 'Admin' : user.displayName}</span>
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