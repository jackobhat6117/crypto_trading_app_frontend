import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-xl py-3 shadow-lg shadow-cyan-500/10'
          : 'bg-black/40 backdrop-blur-md py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              XCrypto
            </div>
          </div>
        </Link>

        <nav className="hidden items-center space-x-6 md:flex">
          <a href="#markets" className="text-gray-300 hover:text-indigo-400 transition-colors">Markets</a>
          <a href="#features" className="text-gray-300 hover:text-indigo-400 transition-colors">Features</a>
          <a href="#about" className="text-gray-300 hover:text-indigo-400 transition-colors">About</a>
          <Link
            to="/signin"
            className="text-gray-300 hover:text-indigo-400 transition-colors duration-200 font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  )
}

