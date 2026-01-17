// components/livestock/LivestockHero.tsx
interface HeroProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string; // Changed from videoUrl to imageUrl
}

export default function LivestockHero({ title, subtitle, imageUrl }: HeroProps) {
  const defaultImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000";

  return (
    <section className="relative h-[45vh] md:h-[65vh] w-full overflow-hidden flex items-center justify-center bg-emerald-950">
      {/* Animated Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center animate-ken-burns opacity-50"
        style={{ backgroundImage: `url(${imageUrl || defaultImage})` }}
      />
      
      {/* Overlay Gradient for better text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-emerald-950/20 via-transparent to-emerald-950/40" />

      <div className="relative z-10 text-center px-4 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-2xl tracking-tight uppercase">
          {title || "Our Species"}
        </h1>
        <p className="text-emerald-50 text-sm md:text-base font-medium max-w-lg mx-auto backdrop-blur-md bg-black/30 p-4 rounded-2xl border border-white/10 shadow-2xl">
          {subtitle || "Ethically raised, breed-specific livestock for premium farming."}
        </p>
      </div>

      <style jsx>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(-1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        .animate-ken-burns {
          animation: kenburns 20s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}