import Hero from '../components/home/Hero'
import Livestock from '../components/home/Livestock'
import Contact from '../components/home/Contact'
import CustomerReviews from '@/components/home/CustomersReview'

export default function HomePageUi() {
  return (
    <div>
      <Hero />
      <div className='p-3'>
        <Livestock />
        <Contact />
      </div>
      <div className='max-h-[40rem] overflow-y-auto'><CustomerReviews/></div>
    </div>
  )
}