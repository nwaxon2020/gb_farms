// components/LivestockCard.tsx
import { useState } from 'react';
import { ShoppingCartIcon, ScaleIcon, XMarkIcon, EyeIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface CardProps {
  name: string;
  breed: string;
  image: string;
  desc: string;
  specs: string;
  color: string;
  price: number;
  onOrder: () => void;
}

export default function LivestockCard({ name, breed, image, desc, specs, color, price, onOrder }: CardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="group bg-white rounded-[2rem] p-3 shadow-lg hover:shadow-xl transition-all duration-500 border border-emerald-50 flex flex-col h-full overflow-hidden">
      
      <div className="relative h-56 w-full overflow-hidden rounded-[1.5rem] mb-4 bg-gray-100 flex items-center justify-center">
        <img 
          src={image || "https://placehold.co/600x400?text=No+Image"} 
          alt={breed} 
          className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-700 pointer-events-none" 
        />
        
        <div className={`absolute top-3 left-3 ${color} text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md`}>
          {name}
        </div>

        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-emerald-50">
          <span className="text-emerald-900 font-black text-base">
            ₦{price?.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="px-2 flex-grow flex flex-col relative">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-xl font-black text-emerald-900 leading-tight truncate">
            {breed}
          </h3>
          <button 
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-600 hover:text-white transition-all shrink-0"
          >
            <EyeIcon className="w-3 h-3" />
            View
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-emerald-100">
            <ScaleIcon className="w-3.5 h-3.5" />
            {specs || "Standard"}
          </div>
        </div>

        <p className="text-gray-500 text-xs leading-snug mb-4 line-clamp-2 italic">
          "{desc}"
        </p>

        <div className="mt-auto pb-1">
          <button 
            onClick={onOrder}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
          >
            <ShoppingCartIcon className="w-4 h-4" />
            <span>Order {name}</span>
          </button>
        </div>
      </div>

      {/* PRODUCT DETAILS OVERLAY */}
      {showDetails && (
        <div className="fixed inset-0 z-[1000] bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-2 pt-20 md:p-8 md:pt-28 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 relative h-full md:h-[33.8rem] flex flex-col">
            
            {/* Close Button - More prominent for desktop */}
            <button 
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-[1010] bg-white/90 p-2 rounded-full text-emerald-900 shadow-lg hover:bg-red-50 hover:text-red-600 transition-all border border-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Main Grid: Responsive 1 col mobile, 2 cols desktop */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                
                {/* Image Section - Sticky-ish on desktop */}
                <div className="col-span-2 h-64 md:h-full min-h-[300px] bg-gray-100 relative">
                  <img src={image} className="w-full h-full object-fill object-center" alt={breed} />
                  <div className={`absolute top-6 left-6 ${color} text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl`}>
                    {name} 
                  </div>
                </div>

                {/* Content Section */}
                <div className="col-span-1 p-4 md:p-6 space-y-6 flex flex-col justify-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 font-black text-2xl tracking-tight">₦{price?.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded border border-gray-100">Market Price</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-emerald-900 leading-none">{breed}</h2>
                  </div>
                 
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                    <p className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest mb-1">Specifications</p>
                    <div className="flex items-center gap-2 text-emerald-900 font-black text-sm uppercase">
                      <ScaleIcon className="w-4 h-4 text-emerald-600" />
                      {specs}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Breeder's Notes</h4>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium bg-gray-50 p-5 rounded-3xl border border-gray-100 italic relative">
                      <span className="absolute -top-2 -left-1 text-4xl text-emerald-200 opacity-50 font-serif">"</span>
                      {desc}
                      <span className="absolute -bottom-6 -right-1 text-4xl text-emerald-200 opacity-50 font-serif">"</span>
                    </p>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => { setShowDetails(false); onOrder(); }}
                      className="w-full py-4 md:py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-800 hover:shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 uppercase text-xs tracking-widest"
                    >
                      <ShoppingCartIcon className="w-5 h-5" />
                      Complete Purchase
                    </button>
                    <p className="text-center text-[9px] text-gray-400 font-bold uppercase mt-4 tracking-tighter">
                      Instant WhatsApp confirmation upon order
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b98120; border-radius: 20px; }
      `}</style>
    </div>
  );
}