'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebaseConfig'
import { doc, onSnapshot } from 'firebase/firestore'
import ChatInterface from './ChatInterface'

const Contact = () => {
  const [contactInfo, setContactInfo] = useState({
    phone: "",
    email: "sales@farmlivestock.com",
    address: "KM 3 Sagamu / Abeokuta Express Way, Logbara, Ogun State.",
    businessHours: "Mon-Fri: 8AM - 6PM EST",
    boilerMessage: ""
  })

  useEffect(() => {
    // ✅ Updated to listen for address and publicDisplayPhone
    const unsub = onSnapshot(doc(db, "settings", "contact"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setContactInfo({
          // ✅ Matches the field name used in your HomeDashboard
          phone: data.publicDisplayPhone || data.phoneNumber || "", 
          email: data.email || "sales@farmlivestock.com",
          address: data.address || "KM 3 Sagamu / Abeokuta Express Way, Logbara, Ogun State.",
          businessHours: data.businessHours || "Mon-Fri: 8AM - 6PM EST",
          boilerMessage: data.boilerMessage || ""
        })
      }
    })
    return () => unsub()
  }, [])

  const [carouselItems] = useState([
    { 
      image: 'https://t3.ftcdn.net/jpg/05/99/16/24/360_F_599162415_WIXWCVTSMwgJOn0wWqQkpZr7IKQ3ir9j.jpg', 
      text: "Whether you're a professional butcher..." 
    },
    { 
      image: 'https://platform.philly.eater.com/wp-content/uploads/sites/8/chorus/uploads/chorus_asset/file/24820884/Mike_Prince.jpeg?quality=90&strip=all&crop=0%2C0%2C100%2C100&w=750', 
      text: "Whether you're a high-end restaurant..." 
    },
    { 
      image: 'https://img.freepik.com/free-photo/photorealistic-portrait-african-women_23-2151435702.jpg?semt=ais_hybrid&w=740&q=80', 
      text: "Or an individual buyer seeking quality..." 
    }
  ])

  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [carouselItems.length])

  const openGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(contactInfo.address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  const whatsappUrl = contactInfo.phone 
    ? `https://wa.me/${contactInfo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(contactInfo.boilerMessage)}`
    : '#'

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="absolute -mt-32"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></span>
            <span>📞 Contact Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-emerald-900 mb-4 md:mb-10">
            Get In <span className="text-amber-600">Touch</span>
          </h2>

          <div className="relative max-w-xl mx-auto mb-8 overflow-hidden rounded-3xl shadow-2xl group">
            <div 
              className="flex transition-transform duration-1000 ease-in-out" 
              style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
            >
              {carouselItems.map((item, i) => (
                <div key={i} className="min-w-full relative">
                  <img src={item.image} alt="Target" className="w-full h-64 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <p className="absolute bottom-6 left-0 right-0 text-white font-bold text-xl px-4 italic">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Whether you're a restaurant, butcher shop, or individual buyer, we're here to help.
          </p>

          <div id='chat'></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                  <span className="text-white text-xl font-black">W</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">WhatsApp</h3>
                <p className="text-green-700 font-semibold text-sm">Fast responses</p>
                <p className='text-[10px] text-gray-400 mt-2 uppercase font-bold'>Instant Chat</p>
              </Link>

              <Link 
                href={`mailto:${contactInfo.email}`}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                   <span className="text-white text-xl font-black">@</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Email Us</h3>
                <p className="text-blue-700 font-semibold text-sm truncate">{contactInfo.email}</p>
                <p className='text-[10px] text-gray-400 mt-2 uppercase font-bold'>Official Inquiry</p>
              </Link>
            </div>

            <div 
              onClick={openGoogleMaps}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center space-x-2">
                <span className="text-amber-600">📍</span>
                <span className="group-hover:text-emerald-700 transition-colors">Visit Our Farm</span>
              </h3>
              <div className="space-y-3">
                <p className="text-gray-600 text-sm">{contactInfo.address}</p>
                <p className="text-gray-600 text-sm font-bold flex items-center gap-2">
                   <span className="text-emerald-600">🕒</span> {contactInfo.businessHours}
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-32">
             <div className="h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-emerald-100">
                <ChatInterface />
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact