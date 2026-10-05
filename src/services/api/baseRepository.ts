/**
 * Base Repository Interface & Implementation
 * Abstract data access layer shielding domain components from direct backend/storage implementation.
 */

import { apiClient, ApiResponse } from './apiClient'
import { config } from '@/config/env'
import { logger } from '@/utils/logger'

export interface IRepository<T, ID = string> {
  getById(id: ID): Promise<T | null>
  getAll(filterParams?: Record<string, any>): Promise<T[]>
  create(item: Omit<T, 'id' | 'createdAt'>): Promise<T>
  update(id: ID, updates: Partial<T>): Promise<T>
  delete(id: ID): Promise<boolean>
}

export abstract class BaseRepository<T extends { id: string }, ID = string> implements IRepository<T, ID> {
  protected resourcePath: string
  protected storageKey?: string

  constructor(resourcePath: string, storageKey?: string) {
    this.resourcePath = resourcePath
    this.storageKey = storageKey
  }

  protected getStoredItems(): T[] {
    if (!this.storageKey || typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(this.storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  protected saveStoredItems(items: T[]): void {
    if (!this.storageKey || typeof window === 'undefined') return
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items))
    } catch (err) {
      logger.warn('repository', `Failed saving items for ${this.storageKey}`, err)
    }
  }

  public async getById(id: ID): Promise<T | null> {
    if (config.enableMockData && this.storageKey) {
      const items = this.getStoredItems()
      return items.find((i) => i.id === String(id)) || null
    }

    try {
      const response = await apiClient.get<T>(`${this.resourcePath}/${id}`)
      return response.data
    } catch (err) {
      logger.error('repository', `Error getting entity ${id} from ${this.resourcePath}`, err)
      return null
    }
  }

  public async getAll(filterParams?: Record<string, any>): Promise<T[]> {
    if (config.enableMockData && this.storageKey) {
      let items = this.getStoredItems()
      if (filterParams) {
        items = items.filter((item: any) => {
          return Object.entries(filterParams).every(([k, v]) => {
            if (v === undefined || v === 'all') return true
            return item[k] === v
          })
        })
      }
      return items
    }

    try {
      const query = filterParams ? '?' + new URLSearchParams(filterParams).toString() : ''
      const response = await apiClient.get<T[]>(`${this.resourcePath}${query}`)
      return response.data
    } catch (err) {
      logger.error('repository', `Error fetching all from ${this.resourcePath}`, err)
      return []
    }
  }

  public async create(item: Omit<T, 'id' | 'createdAt'>): Promise<T> {
    const newItem = {
      ...item,
      id: `${this.resourcePath.replace(/\//g, '')}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as unknown as T

    if (config.enableMockData && this.storageKey) {
      const items = this.getStoredItems()
      this.saveStoredItems([newItem, ...items])
      return newItem
    }

    const response = await apiClient.post<T>(this.resourcePath, item)
    return response.data
  }

  public async update(id: ID, updates: Partial<T>): Promise<T> {
    if (config.enableMockData && this.storageKey) {
      const items = this.getStoredItems()
      const index = items.findIndex((i) => i.id === String(id))
      if (index === -1) throw new Error(`Entity ${id} not found in ${this.storageKey}`)
      const updated = { ...items[index], ...updates, updatedAt: new Date().toISOString() }
      items[index] = updated
      this.saveStoredItems(items)
      return updated
    }

    const response = await apiClient.patch<T>(`${this.resourcePath}/${id}`, updates)
    return response.data
  }

  public async delete(id: ID): Promise<boolean> {
    if (config.enableMockData && this.storageKey) {
      const items = this.getStoredItems()
      const filtered = items.filter((i) => i.id !== String(id))
      this.saveStoredItems(filtered)
      return filtered.length !== items.length
    }

    const response = await apiClient.delete<{ success: boolean }>(`${this.resourcePath}/${id}`)
    return response.status === 200 || response.status === 204
  }
}
