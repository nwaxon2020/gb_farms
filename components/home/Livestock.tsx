'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebaseConfig'
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore'
import Link from 'next/link'

const Livestock = () => {
  const [featuredAnimals, setFeaturedAnimals] = useState<any[]>([])
  const [headerData, setHeaderData] = useState<any>(null)

  const defaultAnimals = [
    {
      id: 1,
      name: 'Premium Pigs',
      icon: '🐖',
      description: 'Free-range pigs raised on natural diets without antibiotics or hormones.',
      image: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      features: ['Natural Diet', 'Free Range', 'Humane Treatment', 'Regular Vet Care']
    },
    {
      id: 2,
      name: 'Grass-fed Cows',
      icon: '🐄',
      description: 'Cattle raised on open pastures with access to fresh grass and clean water.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2070&q=80',
      features: ['Grass Fed', 'Pasture Raised', 'No Hormones', 'Sustainable']
    },
    {
      id: 3,
      name: 'Healthy Goats',
      icon: '🐐',
      description: 'Goats raised in spacious environments with specialized care and nutrition.',
      image: 'https://images.unsplash.com/photo-1552423314-cf29d1c75b8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      features: ['Organic Feed', 'Veterinary Care', 'Ethical Practices', 'Happy Animals']
    },
  ]

  useEffect(() => {
    const q = query(collection(db, "livestock"), where("isFeatured", "==", true));
    const unsubLivestock = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sortedDocs = docs.sort((a: any, b: any) => {
          const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setFeaturedAnimals(sortedDocs);
      } else {
        setFeaturedAnimals([]);
      }
    });

    const unsubHeader = onSnapshot(doc(db, "settings", "homepage"), (doc) => {
      if (doc.exists()) setHeaderData(doc.data());
    });

    return () => { unsubLivestock(); unsubHeader(); }
  }, [])

  const displayAnimals = featuredAnimals.length > 0 ? featuredAnimals.slice(0, 3) : defaultAnimals
  const badgeText = headerData?.livestockBadge || "🐖 Our Premium Livestock"
  const titleText = headerData?.livestockTitle || "Quality Animals, Ethical Farming"
  const descText = headerData?.livestockDesc || "Each animal is raised with care, ensuring they live healthy, stress-free lives in natural environments."

  return (
    <section id="livestock" className="py-20 bg-gradient-to-b from-white to-green-50/50">
      <div className="md:max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            <span>{badgeText}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            {titleText}
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            {descText}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayAnimals.map((animal) => (
            <div 
              key={animal.id}
              className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-64 overflow-hidden">
                <div 
                  className="w-full h-full bg-cover bg-top transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${animal.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-bold text-white font-serif">{animal.breed || animal.name}</h3>
                </div>
              </div>
              
              <div className="p-4 mb:p-8">
                <p className="text-gray-600 mb-6 line-clamp-3">{animal.desc || animal.description}</p>
                
                <div className="mb-4 md:mb-8">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Key Features</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(animal.features || []).map((feature: string, i: number) => (
                      <span 
                        key={i}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* ✅ Added scroll={true} to ensure navigation starts at the top */}
                <Link 
                  href="/livestock" 
                  scroll={true}
                  className="w-full py-3 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Explore Catalog</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Livestock