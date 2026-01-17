// components/LivestockCard.tsx
import { ShoppingCartIcon, ScaleIcon } from '@heroicons/react/24/outline';

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
  return (
    <div className="group bg-white rounded-[2rem] p-3 shadow-lg hover:shadow-xl transition-all duration-500 border border-emerald-50 flex flex-col h-full overflow-hidden">
      
      {/* Reduced Image Container Height from 72 to 56 */}
      <div className="relative h-56 w-full overflow-hidden rounded-[1.5rem] mb-4 bg-gray-100 flex items-center justify-center">
        {/* object-top ensures animal heads aren't cut off if the photo is tall */}
        <img 
          src={image || "https://placehold.co/600x400?text=No+Image"} 
          alt={breed} 
          className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-700 pointer-events-none" 
        />
        
        {/* Category Badge - Smaller Padding */}
        <div className={`absolute top-3 left-3 ${color} text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md`}>
          {name}
        </div>

        {/* Floating Price Tag - More Compact */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-emerald-50">
          <span className="text-emerald-900 font-black text-base">
            ₦{price?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Content Section - Reduced Padding/Margins */}
      <div className="px-2 flex-grow flex flex-col">
        <h3 className="text-xl font-black text-emerald-900 mb-1 leading-tight truncate">
          {breed}
        </h3>
        
        {/* Specs/Weight Badge - Smaller */}
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-emerald-100">
            <ScaleIcon className="w-3.5 h-3.5" />
            {specs || "Standard"}
          </div>
        </div>

        <p className="text-gray-500 text-xs leading-snug mb-4 line-clamp-2 italic">
          "{desc}"
        </p>

        {/* Action Button - Tighter Padding */}
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
    </div>
  );
}