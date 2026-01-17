'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebaseConfig'
import { doc, onSnapshot } from 'firebase/firestore'
import Link from 'next/link'
import VideoBackground from './VideoBackground'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function Hero() {
  const [textIndex, setTextIndex] = useState(0)
  const [dbContent, setDbContent] = useState<any>(null)
  const [showVideo, setShowVideo] = useState(false)

  // Hardcoded Fallbacks
  const defaultTexts = ["Premium Quality", "Ethically Raised", "Sustainable Farming", "Natural Diet"]
  const defaultStats = [
    { value: '25+', label: 'Years', icon: '🏆' },
    { value: '10K+', label: 'Animals', icon: '🐄' },
    { value: '100%', label: 'Natural', icon: '🌿' },
  ]
  const defaultImages = [
    'https://www.nairaland.com/attachments/19387532_1751044648166_jpegd849c07b2c7c20052b36e24b3ab03caa',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80',
    'https://images.squarespace-cdn.com/content/v1/62da63f9ec4d5d07d12a1056/bb963dc5-8e82-41a6-af98-ab4b26c5c289/20220518154718_IMG_5042.jpg',
  ]

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepage"), (doc) => {
      if (doc.exists()) setDbContent(doc.data())
    })
    return () => unsub()
  }, [])

  // Dynamic Data with Fallbacks
  const rotatingTexts = dbContent?.rotatingTexts?.length > 0 ? dbContent.rotatingTexts : defaultTexts
  const stats = dbContent?.stats || defaultStats
  const gridImages = dbContent?.gridImages || defaultImages
  const badge = dbContent?.badge || "🎯 Trusted Since 1995"
  const mainTitle = dbContent?.mainTitle || "FarmFresh"
  const description = dbContent?.description || "Experience the difference of animals raised with care, compassion, and sustainable practices. Your trusted source for premium livestock."
  const tourVideoUrl = dbContent?.tourVideoUrl

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [rotatingTexts.length])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-10 md:pt-20 md:pb-8">
      <VideoBackground />
      <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-emerald-300/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6 md:space-y-8">
            <div className="mt-2 md:mt-4 inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md px-5 py-2 md:px-6 md:py-3 rounded-full border border-white/20 shadow-xl">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-sm md:text-base font-semibold text-white">{badge}</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-black leading-tight text-white">
                {mainTitle}
                <div className="text-2xl md:text-5xl h-[1.2em] md:h-[1.3em] overflow-hidden relative">
                  <div className="transition-all duration-700 ease-in-out" style={{ transform: `translateY(-${textIndex * 25}%)` }}>
                    {rotatingTexts.map((text: string, index: number) => (
                      <div key={index} className="h-[1.2em] flex items-center bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-yellow-500 pb-2">
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </h1>
              <p className="text-base md:text-xl text-emerald-100 max-w-xl leading-relaxed opacity-90">{description}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-2 md:pt-4">
              <Link href="/livestock" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-center">
                Explore Our Farm
              </Link>
              <button 
                onClick={() => tourVideoUrl && setShowVideo(true)}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-all text-center flex items-center justify-center space-x-2"
              >
                <span>▶</span>
                <span>Watch Tour</span>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 md:gap-4 pt-3 md:pt-8">
              {stats.map((stat: any, index: number) => (
                <div key={index} className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs md:text-sm text-emerald-200 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-emerald-900/20 p-4">
              <div className="grid grid-cols-2 gap-3">
                {gridImages.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt="Livestock" className="h-40 w-full object-cover rounded-xl hover:scale-105 transition-transform" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowVideo(false)}>
          <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowVideo(false)} className="absolute top-4 right-4 z-50 text-white hover:text-emerald-400">
              <XMarkIcon className="w-8 h-8" />
            </button>
            <video src={tourVideoUrl} controls autoPlay className="w-full h-full" />
          </div>
        </div>
      )}

      <div className="absolute bottom-3 right-3 md:bottom-10 md:right-10 text-4xl opacity-20 hidden md:block animate-bounce">🐄</div>
    </section>
  )
}