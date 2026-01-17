import Hero from '../components/home/Hero'
import Livestock from '../components/home/Livestock'
import Contact from '../components/home/Contact'

export default function HomePageUi() {
  return (
    <div>
      <Hero />
      <div className='p-3'>
        <Livestock />
        <Contact />
      </div>
    </div>
  )
}