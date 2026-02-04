'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebaseConfig'
import { doc, onSnapshot, Unsubscribe, setDoc, serverTimestamp } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { LockClosedIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function RevenueStats() {
  const [stats, setStats] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [showResetModal, setShowResetModal] = useState(false);
  const [ceoPass, setCeoPass] = useState('');

  useEffect(() => {
    let unsub: Unsubscribe | undefined;
    try {
      unsub = onSnapshot(doc(db, "salesStats", "totals"), 
        (snap) => {
          if (snap.exists()) {
            setStats(snap.data() as any);
          }
        },
        (err) => console.log("Waiting for database connection...")
      );
    } catch (e) {
      console.error("Firestore sync error:", e);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  const handleReset = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return toast.error("No active CEO session");

    const tId = toast.loading("Verifying CEO...");
    try {
      const credential = EmailAuthProvider.credential(user.email, ceoPass);
      await reauthenticateWithCredential(user, credential);
      
      // ✅ PERMANENT WIPE LOGIC
      await setDoc(doc(db, "salesStats", "totals"), {
        daily: 0,
        monthly: 0,
        yearly: 0,
        lastUpdate: serverTimestamp()
      });

      toast.success("Revenue Totals Reset", { id: tId });
      setShowResetModal(false);
      setCeoPass('');
    } catch (error) {
      toast.error("Incorrect Password", { id: tId });
    }
  };

  return (
    <div className="relative w-full">
      {/* CEO RESET OVERLAY */}
      {showResetModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <LockClosedIcon className="w-10 h-10 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase text-gray-900 mb-2">Reset Revenue</h2>
            <p className="text-[10px] text-gray-400 font-bold mb-6 uppercase">This will zero out all permanent cards</p>
            <input 
              type="password" 
              placeholder="Enter CEO Password" 
              className="w-full p-4 bg-gray-50 border-2 rounded-xl text-center font-black outline-none mb-4"
              onChange={e => setCeoPass(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <button onClick={handleReset} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs">Confirm Wipe</button>
              <button onClick={() => setShowResetModal(false)} className="text-[10px] font-black text-gray-400 uppercase py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 pt-8 text-center w-full relative group">
        {/* Reset Button (Visible on Hover) */}
        <button 
          onClick={() => setShowResetModal(true)}
          className="absolute -top-2 right-0 p-2 bg-gray-100 text-gray-400 hover:text-red-600 rounded-full transition-all opacity-0 group-hover:opacity-100"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>

        <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Today Revenue</p>
          <p className="text-2xl font-black text-emerald-900">₦{stats.daily.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
          <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Monthly Total</p>
          <p className="text-2xl font-black text-blue-900">₦{stats.monthly.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100">
          <p className="text-[10px] font-black text-purple-600 uppercase mb-1 tracking-widest">Yearly Total</p>
          <p className="text-2xl font-black text-purple-900">₦{stats.yearly.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}