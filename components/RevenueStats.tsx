'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebaseConfig'
import { doc, onSnapshot, Unsubscribe, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function RevenueStats() {
  const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
  const [showResetModal, setShowResetModal] = useState(false);
  const [ceoPass, setCeoPass] = useState('');

  useEffect(() => {
    // 1. Run the Auto-Reset Check
    checkAndResetStats();

    // 2. Real-time sync with database
    let unsub: Unsubscribe | undefined;
    unsub = onSnapshot(doc(db, "salesStats", "totals"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats({
          daily: data.daily || 0,
          weekly: data.weekly || 0,
          monthly: data.monthly || 0,
          yearly: data.yearly || 0
        });
      }
    });

    return () => { if (unsub) unsub(); };
  }, []);

  const checkAndResetStats = async () => {
    const docRef = doc(db, "salesStats", "totals");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const lastUpdate = data.lastUpdate?.toDate() || new Date();
    const now = new Date();

    // --- RESET LOGIC CALCULATIONS ---
    
    // Daily: Different calendar day
    const isNewDay = now.toDateString() !== lastUpdate.toDateString();

    // Weekly: Different week number (ISO week)
    const getWeek = (d: Date) => {
      const dt = new Date(d);
      dt.setHours(0,0,0,0);
      dt.setDate(dt.getDate() + 4 - (dt.getDay() || 7));
      return Math.ceil((((dt.getTime() - new Date(dt.getFullYear(),0,1).getTime()) / 86400000) + 1) / 7);
    };
    const isNewWeek = getWeek(now) !== getWeek(lastUpdate);

    // Monthly: Different month OR different year
    const isNewMonth = now.getMonth() !== lastUpdate.getMonth() || now.getFullYear() !== lastUpdate.getFullYear();

    // Yearly: Different year
    const isNewYear = now.getFullYear() !== lastUpdate.getFullYear();

    // If any period has lapsed, update the database
    if (isNewDay || isNewWeek || isNewMonth || isNewYear) {
      await setDoc(docRef, {
        daily: isNewDay ? 0 : (data.daily || 0),
        weekly: isNewWeek ? 0 : (data.weekly || 0),
        monthly: isNewMonth ? 0 : (data.monthly || 0),
        yearly: isNewYear ? 0 : (data.yearly || 0),
        lastUpdate: serverTimestamp() // Set to now for the next comparison
      }, { merge: true });
    }
  };

  const handleManualReset = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return toast.error("No active CEO session");

    const tId = toast.loading("Verifying CEO Master Key...");
    try {
      const credential = EmailAuthProvider.credential(user.email, ceoPass);
      await reauthenticateWithCredential(user, credential);
      
      await setDoc(doc(db, "salesStats", "totals"), {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        lastUpdate: serverTimestamp()
      }, { merge: true });

      toast.success("All Revenue Data Wiped Successfully", { id: tId });
      setShowResetModal(false);
      setCeoPass('');
    } catch (error) {
      toast.error("Invalid Admin Password", { id: tId });
    }
  };

  return (
    <div className="relative w-full">
      {showResetModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LockClosedIcon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase text-gray-900 mb-2">Manual Wipe</h2>
            <p className="text-[10px] text-gray-400 font-bold mb-6 uppercase">Clear all revenue totals immediately</p>
            <input 
              type="password" 
              placeholder="Enter CEO Password" 
              className="w-full p-4 bg-gray-50 border-2 rounded-xl text-center font-black outline-none mb-4"
              onChange={e => setCeoPass(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <button onClick={handleManualReset} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs">Confirm Clear</button>
              <button onClick={() => setShowResetModal(false)} className="text-[10px] font-black text-gray-400 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10 pt-8 text-center w-full relative group">
        <button 
          onClick={() => setShowResetModal(true)}
          className="absolute -top-2 right-0 p-2 bg-gray-100 text-gray-400 hover:text-red-600 rounded-full transition-all opacity-0 group-hover:opacity-100"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>

        {/* Daily Card */}
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Today</p>
          <p className="text-2xl font-black text-emerald-900 tracking-tighter">₦{stats.daily.toLocaleString()}</p>
        </div>

        {/* Weekly Card */}
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
          <p className="text-[10px] font-black text-amber-600 uppercase mb-1 tracking-widest">This Week</p>
          <p className="text-2xl font-black text-amber-900 tracking-tighter">₦{stats.weekly.toLocaleString()}</p>
        </div>

        {/* Monthly Card */}
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
          <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">This Month</p>
          <p className="text-2xl font-black text-blue-900 tracking-tighter">₦{stats.monthly.toLocaleString()}</p>
        </div>

        {/* Yearly Card */}
        <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
          <p className="text-[10px] font-black text-purple-600 uppercase mb-1 tracking-widest">This Year</p>
          <p className="text-2xl font-black text-purple-900 tracking-tighter">₦{stats.yearly.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}