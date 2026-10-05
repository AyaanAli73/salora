import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Clock,
  Star,
  Search,
  ArrowRight,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import { customerPortalService } from '@/services/customerPortalService'
import { Service } from '@/types'

export const CustomerServicesPage: React.FC = () => {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true)
      try {
        const list = await customerPortalService.getPublicServices()
        setServices(list)

        const uniqueCats = Array.from(
          new Set(list.map((s: Service) => s.categoryName || 'General'))
        ) as string[]
        setCategories(['All', ...uniqueCats])
      } catch (err) {
        console.error('Failed to load services:', err)
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [])

  // Filtered Services
  const filteredServices = services.filter((s) => {
    const matchesCategory =
      selectedCategory === 'All' || (s.categoryName || 'General') === selectedCategory
    const matchesSearch =
      searchQuery.trim() === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950/70 to-slate-900 border border-violet-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Curated Treatments & Rituals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
            Salon & Spa Service Catalog
          </h1>
          <p className="text-slate-300 text-sm">
            Discover our spectrum of bespoke hair coloring, restorative scalp therapy, luxury facials, and couture nail art performed by master stylists.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rituals by name or description…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredServices.length}</strong> rituals
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-violet-400 ${
                selectedCategory === category
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading salon service catalog…</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 p-8">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No matching services found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Try adjusting your search criteria or switch to another category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/40 p-6 shadow-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                    {service.categoryName || 'General'}
                  </span>
                  <div className="flex items-center text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    <span className="font-bold">4.9</span>
                    <span className="text-slate-500 ml-1">(80+)</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-violet-300 transition-colors">
                  {service.name}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {service.description ||
                    'Personalized luxury service executed with certified dermatological and organic formulations.'}
                </p>

                <div className="mt-4 flex items-center space-x-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <span>Duration: {service.duration} mins</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Starting from</span>
                  <span className="text-xl font-extrabold text-white tabular-nums">
                    ₹{service.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <Link
                  to={`/customer/book?serviceId=${service.id}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md shadow-violet-600/30 transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
