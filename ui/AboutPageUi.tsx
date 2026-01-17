'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { 
  SparklesIcon, TrophyIcon, UserGroupIcon, 
  GlobeAltIcon, CheckCircleIcon, HeartIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function AboutPageUi() {
  const [about, setAbout] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutContent()
  }, [])

  const fetchAboutContent = async () => {
    try {
      const aboutSnap = await getDoc(doc(db, "settings", "about"))
      const contactSnap = await getDoc(doc(db, "settings", "contact"))

      // ✅ DEFAULT DATA: This ensures the page has images even if Admin hasn't saved yet
      let finalData = {
        heroTitle: 'Our Story of Passion & Purpose',
        heroSubtitle: 'Where Tradition Meets Innovation in Modern Farming',
        heroDescription: 'For over 25 years, we have been dedicated to redefining excellence in livestock farming...',
        mission: 'To revolutionize livestock farming...',
        vision: 'A world where every animal is raised with dignity...',
        ceoName: 'Johnathan O. Williams',
        ceoTitle: 'Founder & Chief Executive Officer',
        ceoImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
        ceoQuote: 'True farming is not just a business...',
        ceoBio: 'With 25+ years in sustainable agriculture...',
        values: [
          { icon: '🌱', title: 'Sustainability', description: 'Regenerative practices' },
          { icon: '❤️', title: 'Animal Welfare', description: 'Stress-free environments' }
        ],
        stats: [
          { value: '25+', label: 'Years Experience' },
          { value: '5000+', label: 'Happy Clients' }
        ],
        teamImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80',
        careersEmail: 'sales@farmlivestock.com'
      }

      if (aboutSnap.exists()) {
        // ✅ Override defaults with real Admin data
        finalData = { ...finalData, ...aboutSnap.data() }
      }

      if (contactSnap.exists()) {
        const contactData = contactSnap.data()
        finalData.careersEmail = contactData.email || finalData.careersEmail
      }

      setAbout(finalData)
    } catch (error) {
      console.error("Error fetching about content:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // ✅ Never returns null now, will always show at least default data
  if (!about) return null

  return (
    <div className="mx-auto max-w-[1200px] min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-purple-50 px-4 py-2 rounded-full border border-emerald-100">
                <SparklesIcon className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 text-xs font-black uppercase tracking-widest">Our Legacy</span>
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-black text-gray-900 leading-tight">
                {about.heroTitle}
              </h1>
              <p className="md:text-xl text-emerald-700 font-bold">
                {about.heroSubtitle}
              </p>
              <p className="text-gray-600 md:text-lg leading-relaxed">
                {about.heroDescription}
              </p>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* ✅ CEO IMAGE FROM DATABASE */}
                <img src={about.ceoImage} className="h-64 w-full object-cover rounded-3xl shadow-xl" alt="CEO" />
                <div className="space-y-4">
                  <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80" className="h-30 w-full object-cover rounded-3xl shadow-xl" alt="Farm" />
                  <img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80" className="h-30 w-full object-cover rounded-3xl shadow-xl" alt="Livestock" />
                </div>
              </div>
              <div className="absolute -bottom-12 right-0 md:-bottom-20 md:-right-5 bg-white p-4 md:p-6 rounded-lg md:rounded-3xl shadow-2xl border border-emerald-100 max-w-xs">
                <div className="flex items-center gap-3">
                  <TrophyIcon className="w-6 h-6 md:w-8 md:h-8 text-amber-600" />
                  <div>
                    <p className="text-xl md:text-2xl font-black text-gray-900">25+</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">Years Excellence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {about.stats.map((stat: any, index: number) => (
              <div key={index} className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-2xl md:text-4xl font-black text-emerald-900 mb-2">{stat.value}</p>
                <p className="text-sm text-gray-600 font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-emerald-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-2xl">
                  <GlobeAltIcon className="w-6 h-6 text-emerald-700" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">Our Mission</h2>
              </div>
              <p className="text-gray-700 md:text-lg leading-relaxed">
                {about.mission}
              </p>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-2xl">
                  <SparklesIcon className="w-6 h-6 text-purple-700" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">Our Vision</h2>
              </div>
              <p className="text-gray-700 md:text-lg leading-relaxed">
                {about.vision}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 md:text-lg max-w-2xl mx-auto">The principles that guide every decision we make</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {about.values.map((value: any, index: number) => (
              <div key={index} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="text-xl md:text-3xl mb-4">{value.icon}</div>
                <h3 className="md:text-xl font-black text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CEO Section */}
      <section className="md:py-20 px-4 md:px-8 bg-gradient-to-br from-gray-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 md:space-y-6 space-y-3">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
                <span className="text-emerald-700 text-xs font-black uppercase tracking-widest">Leadership</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-gray-900">Meet Our Founder</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-lg md:text-2xl font-black text-gray-900">{about.ceoName}</p>
                  <p className="text-sm md:text-base text-emerald-700 font-bold">{about.ceoTitle}</p>
                </div>
                <blockquote className="md:text-xl italic text-gray-700 border-l-4 border-emerald-500 pl-6 py-2">
                  "{about.ceoQuote}"
                </blockquote>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  {about.ceoBio}
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                {/* ✅ CEO IMAGE FROM DATABASE */}
                <img 
                  src={about.ceoImage} 
                  className="w-full h-[450px] md:h-[500px] object-cover rounded-3xl shadow-2xl"
                  alt={about.ceoName}
                />
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 via-purple-400 to-pink-400 rounded-[2.5rem] blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-300 to-purple-300 rounded-[2rem] blur-md opacity-20"></div>
              </div>
              <div className="absolute -bottom-6 left-0 md:-left-6 bg-white p-6 rounded-lg md:rounded-3xl shadow-2xl border border-gray-100 max-w-xs z-20">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-black text-gray-900">Trusted Leader</p>
                    <p className="text-xs text-gray-500">25+ Years Experience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {/* ✅ TEAM IMAGE FROM DATABASE */}
              <img 
                src={about.teamImage} 
                className="w-full h-[450px] md:h-[500px] object-cover rounded-3xl shadow-xl"
                alt="Our Team"
              />
              <div className="absolute -bottom-6 right-0 md:-right-6 bg-white p-4 rounded-lg md:rounded-3xl shadow-2xl border border-emerald-100 max-w-xs">
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-xl font-black text-gray-900">50+</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">Dedicated Experts</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-purple-50 px-4 py-2 rounded-full border border-emerald-100">
                <HeartIcon className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 text-xs font-black uppercase tracking-widest">Our Family</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">The FarmFresh Family</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Our team of passionate farmers, veterinarians, and agriculture experts work together to ensure every animal receives the highest standard of care. We believe that happy animals raised in stress-free environments produce the best quality products.
              </p>
              <div className="pt-4">
                <Link 
                  href={`mailto:${about.careersEmail}`}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  Join Our Team
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-600 to-purple-600 rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to Experience Quality?</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers who trust FarmFresh for premium, ethically-raised livestock.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/livestock" 
                  className="bg-white text-emerald-700 px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Browse Livestock
                </Link>
                <Link 
                  href="/#chat" 
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-2xl font-bold hover:bg-white/10 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-48 -translate-x-48"></div>
          </div>
        </div>
      </section>
    </div>
  )
}