import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import {
  ClientStats,
  ClientFilters,
  ClientTable,
  ClientForm,
  RecentClientsWidget,
  ImportClientsModal,
  BulkActionsBar,
} from '@/features/clients'
import { clientService, ClientFilterParams, ClientListResult } from '@/services/clientService'
import { Client, ClientStatsSummary } from '@/types'
import { useToastStore } from '@/store/useToastStore'

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  // State
  const [stats, setStats] = useState<ClientStatsSummary | null>(null)
  const [clientResult, setClientResult] = useState<ClientListResult>({
    clients: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  })
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals & Drawers state
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Filters state
  const [filters, setFilters] = useState<ClientFilterParams>({
    search: '',
    status: 'all',
    gender: 'all',
    sortBy: 'latest',
    sortOrder: 'desc',
    page: 1,
    pageSize: 10,
  })

  // Load clients and stats from service layer
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [statsData, filteredResult, recent] = await Promise.all([
        clientService.getStats(),
        clientService.getFiltered(filters),
        clientService.getRecentClients(5),
      ])

      setStats(statsData)
      setClientResult(filteredResult)
      setRecentClients(recent)
    } catch (err) {
      console.error('Failed to load clients data:', err)
      addToast({
        title: 'Error',
        message: 'Could not fetch clients from salon service.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const handleClientCreated = () => {
      loadData()
    }
    window.addEventListener('salora:client-created', handleClientCreated)
    return () => {
      window.removeEventListener('salora:client-created', handleClientCreated)
    }
  }, [loadData])

  // Filter handlers
  const handleFilterChange = (updates: Partial<ClientFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      gender: 'all',
      sortBy: 'latest',
      sortOrder: 'desc',
      page: 1,
      pageSize: 10,
    })
  }

  // Row selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (select: boolean) => {
    if (select) {
      const pageIds = clientResult.clients.map((c) => c.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    } else {
      const pageIdSet = new Set(clientResult.clients.map((c) => c.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIdSet.has(id)))
    }
  }

  // Create Client
  const handleCreateClient = async (data: Partial<Client>) => {
    try {
      const newClient = await clientService.create(data)
      addToast({
        title: 'Client Added',
        message: `${newClient.fullName} was added to the salon database.`,
        type: 'success',
      })
      loadData()
    } catch {
      addToast({
        title: 'Failed',
        message: 'Unable to create client record.',
        type: 'danger',
      })
    }
  }

  // Update Client
  const handleUpdateClient = async (data: Partial<Client>) => {
    if (!editingClient) return
    try {
      const updated = await clientService.update(editingClient.id, data)
      addToast({
        title: 'Client Updated',
        message: `${updated.fullName}'s profile was updated.`,
        type: 'success',
      })
      setEditingClient(null)
      loadData()
    } catch {
      addToast({
        title: 'Failed',
        message: 'Unable to update client details.',
        type: 'danger',
      })
    }
  }

  // Delete Single Client
  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to archive this client record?')) {
      try {
        await clientService.delete(id)
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        addToast({
          title: 'Client Archived',
          message: 'Client record removed from active database.',
          type: 'info',
        })
        loadData()
      } catch {
        addToast({
          title: 'Error',
          message: 'Could not archive client.',
          type: 'danger',
        })
      }
    }
  }

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to archive all ${selectedIds.length} selected clients?`)) {
      try {
        await clientService.bulkDelete(selectedIds)
        addToast({
          title: 'Clients Archived',
          message: `${selectedIds.length} client records have been archived.`,
          type: 'info',
        })
        setSelectedIds([])
        loadData()
      } catch {
        addToast({
          title: 'Error',
          message: 'Bulk delete operation failed.',
          type: 'danger',
        })
      }
    }
  }

  const handleBulkAddTag = async (tag: string) => {
    try {
      await clientService.bulkAddTag(selectedIds, tag)
      addToast({
        title: 'Tag Applied',
        message: `Applied tag "${tag}" to ${selectedIds.length} clients.`,
        type: 'success',
      })
      loadData()
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not apply tag in bulk.',
        type: 'danger',
      })
    }
  }

  const handleBulkExport = () => {
    const selectedClients = clientResult.clients.filter((c) => selectedIds.includes(c.id))
    const csvData = clientService.exportToCsv(selectedClients)
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SALORA_Selected_Clients_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    addToast({
      title: 'Export Downloaded',
      message: `Exported ${selectedIds.length} selected clients as CSV.`,
      type: 'success',
    })
  }

  const handleExportAll = () => {
    const csvData = clientService.exportToCsv()
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SALORA_All_Clients_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    addToast({
      title: 'Database Exported',
      message: 'All client records downloaded as CSV spreadsheet.',
      type: 'success',
    })
  }

  const handleSendMessage = (client?: Client) => {
    const target = client ? client.fullName : `${selectedIds.length} selected clients`
    addToast({
      title: 'Message Queued',
      message: `Promotional & appointment SMS dispatch scheduled for ${target}.`,
      type: 'info',
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
              Clients
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold hidden sm:inline-flex">
              Client Directory
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage customer profiles, booking history, loyalty points, and client retention.
          </p>
        </div>

        {/* Top actions: Import Clients & Add New Client */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={handleExportAll}
            leftIcon={<Download className="h-4 w-4" />}
            className="hidden sm:inline-flex"
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Import Clients
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewClientOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glow-primary/40 font-semibold"
          >
            Add New Client
          </Button>
        </div>
      </div>

      {/* 2. Stat KPI Cards & Client Statistics Donut Chart */}
      {stats ? (
        <ClientStats stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-surface border border-border animate-pulse p-6" />
          ))}
        </div>
      )}

      {/* 3. Main CRM Layout: Client Table Card + Sidebar Companion Widget */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Column: All Clients Table Card */}
        <div className="xl:col-span-9 space-y-4">
          <Card className="p-5 sm:p-6 space-y-5">
            <CardHeader className="p-0 pb-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Clients</CardTitle>
                  <CardDescription>
                    Browse, filter, and manage your complete customer directory
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Reusable ClientFilters */}
            <ClientFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              totalCount={clientResult.total}
            />

            {/* Reusable ClientTable */}
            <ClientTable
              clients={clientResult.clients}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClientClick={(client) => navigate(`/clients/${client.id}`)}
              onEditClient={(client) => setEditingClient(client)}
              onDeleteClient={handleDeleteClient}
              onSendMessage={handleSendMessage}
              pagination={{
                page: clientResult.page,
                totalPages: clientResult.totalPages,
                total: clientResult.total,
                pageSize: clientResult.pageSize,
                onPageChange: (newPage) => handleFilterChange({ page: newPage }),
              }}
              isLoading={isLoading}
            />
          </Card>
        </div>

        {/* Sidebar Column: Recent Clients Companion Widget */}
        <div className="xl:col-span-3 space-y-6">
          <RecentClientsWidget clients={recentClients} />
        </div>
      </div>

      {/* 4. Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onSendMessage={() => handleSendMessage()}
        onAddTag={handleBulkAddTag}
        onExport={handleBulkExport}
        onDelete={handleBulkDelete}
      />

      {/* 5. Add New Client Drawer */}
      <ClientForm
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onSubmit={handleCreateClient}
        asDrawer={true}
      />

      {/* 6. Edit Client Drawer */}
      <ClientForm
        isOpen={Boolean(editingClient)}
        onClose={() => setEditingClient(null)}
        onSubmit={handleUpdateClient}
        initialData={editingClient}
        asDrawer={true}
      />

      {/* 7. Import Clients Wizard Modal */}
      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          loadData()
          addToast({
            title: 'Database Updated',
            message: 'New client records are now available in your directory.',
            type: 'success',
          })
        }}
      />
    </div>
  )
}
