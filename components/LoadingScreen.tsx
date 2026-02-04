'use client'

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        {/* The Outer Pulsing Ring */}
        <div className="absolute h-20 w-20 animate-ping rounded-full bg-green-200 opacity-75"></div>
        
        {/* The Main Spinning Ring */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-100 border-t-green-600 shadow-sm"></div>
        
        {/* Center Logo/Initial */}
        <div className="absolute flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-lg">
          <img src="/site_logo.png" alt="site logo" />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="mt-8 flex flex-col items-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 animate-pulse">
          FarmFresh
        </p>
        <div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-full origin-left animate-loading-bar bg-green-600"></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen