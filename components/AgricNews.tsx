'use client'
import { useState, useEffect } from 'react'
import { NewspaperIcon, ArrowTopRightOnSquareIcon, GlobeAltIcon, PhotoIcon } from '@heroicons/react/24/outline'

export default function AgricNews() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY
        const query = encodeURIComponent('Nigeria AND (agriculture OR "food prices" OR livestock)')
        const res = await fetch(
          `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=4&apiKey=${apiKey}`
        )
        const data = await res.json()
        if (data.articles) setArticles(data.articles)
      } catch (err) {
        console.error("News Fetch Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  if (loading) return (
    <div className="animate-pulse flex flex-col gap-4 p-4">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
      </div>
    </div>
  )

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h2 className="text-lg md:text-2xl font-black text-emerald-900 flex items-center gap-2 uppercase tracking-tight">
              <NewspaperIcon className="w-7 h-7 text-emerald-600" />
              Market Intelligence
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Nigerian Agric Updates</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <GlobeAltIcon className="w-3 h-3 animate-spin-slow" />
            LIVE UPDATES
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.length > 0 ? articles.map((post, idx) => (
            <a 
              href={post.url} 
              target="_blank" 
              rel="noopener noreferrer"
              key={idx} 
              className="bg-white p-3 md:p-5 rounded-lg border border-gray-100 flex flex-row gap-5 hover:shadow-xl hover:border-emerald-200 transition-all group"
            >
              {/* Left Side: Small Image */}
              <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                {post.urlToImage ? (
                  <img 
                    src={post.urlToImage} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                ) : (
                  <PhotoIcon className="w-8 h-8 text-gray-200" />
                )}
              </div>

              {/* Right Side: Content */}
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">
                      {post.source.name}
                    </span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 italic mb-3">
                    {post.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    {new Date(post.publishedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-[9px] font-black text-emerald-900 underline decoration-emerald-200 decoration-2 underline-offset-4">
                    Read Analysis
                  </span>
                </div>
              </div>
            </a>
          )) : (
            <div className="col-span-full p-10 bg-white rounded-[2rem] text-center border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold italic">No news updates available at the moment. Check back soon.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}