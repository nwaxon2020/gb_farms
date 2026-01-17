'use client'

export default function VideoBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-emerald-950">
      {/* ✅ Animated Image Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60 animate-ken-burns"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=2070&q=80')` 
        }}
      />
      
      {/* Improved Overlay for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/60 to-transparent"></div>
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Decorative Floating Elements */}
      <div className="absolute top-1/4 left-10 animate-pulse text-2xl opacity-20 select-none">🍃</div>
      <div className="absolute bottom-1/4 right-20 animate-bounce text-2xl opacity-20 select-none">🌿</div>

      {/* Tailwind Custom Animation Style */}
      <style jsx global>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(-1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        .animate-ken-burns {
          animation: kenburns 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}