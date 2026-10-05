import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Building2,
  Users,
  Activity,
  ArrowLeft,
  Sun,
  Moon,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react'
import { useThemeStore } from '@/store/useThemeStore'
import { ToastContainer } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

export const SuperAdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Super Admin Top Header */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Brand & Mode */}
        <div className="flex items-center gap-4">
          <Link
            to="/super-admin"
            className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  SALORA
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-teal-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">
                Multi-Tenant Cloud Infrastructure
              </p>
            </div>
          </Link>

          {/* System Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">99.98% Uptime</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono">Cluster: ap-south-1</span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          <Link
            to="/super-admin"
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Overview
          </Link>
          <Link
            to="/super-admin/plans"
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>SaaS Plans & Quotas</span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Back to Salon Dashboard */}
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Salon Dashboard</span>
          </Link>

          {/* Super Admin Identity Badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold text-xs">
              SA
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-200 leading-tight">
                Platform Admin
              </span>
              <span className="text-[10px] text-teal-400 font-mono leading-none">
                root@salora.cloud
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Platform Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Salora Salon SaaS Engine • Multi-Tenant Architecture v2.4</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-slate-400" />
            Active Tenants Isolated
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            End-to-End Cryptographic Audit Trail
          </span>
        </div>
      </footer>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}
