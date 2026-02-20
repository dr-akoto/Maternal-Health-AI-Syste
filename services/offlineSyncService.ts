/**
 * Offline Sync Service
 * 
 * Features:
 * - Queue operations when offline
 * - Sync when back online
 * - Local data caching
 * - Conflict resolution
 * 
 * Note: This service uses expo-secure-store for storage
 * and checks network status manually. For production,
 * you may want to add @react-native-community/netinfo.
 */

import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Dynamically import SecureStore to avoid errors if not installed
let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // expo-secure-store not available, will fall back to localStorage
}

// Simple storage wrapper that works on both web and native
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web' || !SecureStore) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web' || !SecureStore) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore storage errors
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web' || !SecureStore) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore storage errors
    }
  },
};

export interface QueuedOperation {
  id: string;
  tableName: string;
  operationType: 'insert' | 'update' | 'delete';
  data: any;
  primaryKey?: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  queuedOperations: number;
  lastSyncTime: string | null;
  isSyncing: boolean;
}

const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'offline_sync_queue',
  LAST_SYNC: 'last_sync_time',
  CACHED_DATA: 'cached_data',
};

const MAX_RETRIES = 3;

class OfflineSyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the offline sync service
   */
  private async initialize() {
    // Check initial network state
    this.isOnline = await this.checkNetwork();

    // Start periodic network check and sync
    this.startPeriodicSync();
  }

  /**
   * Check network status by trying to reach the server
   */
  async checkNetwork(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }
    return this.isOnline;
  }

  /**
   * Start periodic sync (every 5 minutes when online)
   */
  private startPeriodicSync() {
    this.syncInterval = setInterval(async () => {
      // Check network status
      const wasOffline = !this.isOnline;
      await this.checkNetwork();
      
      // If we just came online, sync
      if (wasOffline && this.isOnline) {
        this.notifyListeners();
        this.syncQueue();
      } else if (this.isOnline && !this.isSyncing) {
        this.syncQueue();
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add a listener for sync status changes
   */
  addListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    // Immediately notify with current status
    this.getStatus().then(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (status: SyncStatus) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of status change
   */
  private async notifyListeners() {
    const status = await this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const queue = await this.getQueue();
    const lastSync = await storage.getItem(STORAGE_KEYS.LAST_SYNC);
    
    return {
      isOnline: this.isOnline,
      queuedOperations: queue.length,
      lastSyncTime: lastSync,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Get the offline queue
   */
  private async getQueue(): Promise<QueuedOperation[]> {
    try {
      const queueStr = await storage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save the queue
   */
  private async saveQueue(queue: QueuedOperation[]) {
    await storage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    this.notifyListeners();
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Queue an operation for later sync
   */
  async queueOperation(
    tableName: string,
    operationType: 'insert' | 'update' | 'delete',
    data: any,
    primaryKey?: string
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: this.generateId(),
      tableName,
      operationType,
      data,
      primaryKey,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    const queue = await this.getQueue();
    queue.push(operation);
    await this.saveQueue(queue);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncQueue();
    }

    return operation.id;
  }

  /**
   * Execute an operation with offline support
   * Returns immediately if online, queues if offline
   */
  async executeWithOfflineSupport<T>(
    tableName: string,
    operationType: 'insert' | 'update' | 'delete',
    operation: () => Promise<T>,
    data: any,
    primaryKey?: string
  ): Promise<{ success: boolean; data?: T; queued?: boolean; queueId?: string }> {
    if (this.isOnline) {
      try {
        const result = await operation();
        return { success: true, data: result };
      } catch (error) {
        // If the operation failed due to network, queue it
        const queueId = await this.queueOperation(tableName, operationType, data, primaryKey);
        return { success: false, queued: true, queueId };
      }
    } else {
      // Offline - queue the operation
      const queueId = await this.queueOperation(tableName, operationType, data, primaryKey);
      return { success: false, queued: true, queueId };
    }
  }

  /**
   * Sync all queued operations
   */
  async syncQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getQueue();
      const remainingQueue: QueuedOperation[] = [];

      for (const operation of queue) {
        try {
          await this.executeOperation(operation);
          synced++;

          // Also save to database sync log
          await this.logSyncToDatabase(operation, 'synced');
        } catch (error: any) {
          operation.retryCount++;
          operation.lastError = error.message;

          if (operation.retryCount < MAX_RETRIES) {
            remainingQueue.push(operation);
          } else {
            failed++;
            await this.logSyncToDatabase(operation, 'failed');
          }
        }
      }

      await this.saveQueue(remainingQueue);
      await storage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { synced, failed };
  }

  /**
   * Execute a single queued operation
   */
  private async executeOperation(operation: QueuedOperation) {
    const { tableName, operationType, data, primaryKey } = operation;

    switch (operationType) {
      case 'insert':
        const { error: insertError } = await (supabase as any)
          .from(tableName)
          .insert(data);
        if (insertError) throw insertError;
        break;

      case 'update':
        if (!primaryKey) throw new Error('Primary key required for update');
        const { error: updateError } = await (supabase as any)
          .from(tableName)
          .update(data)
          .eq('id', primaryKey);
        if (updateError) throw updateError;
        break;

      case 'delete':
        if (!primaryKey) throw new Error('Primary key required for delete');
        const { error: deleteError } = await (supabase as any)
          .from(tableName)
          .delete()
          .eq('id', primaryKey);
        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Log sync operation to database
   */
  private async logSyncToDatabase(operation: QueuedOperation, status: 'synced' | 'failed') {
    try {
      await (supabase as any)
        .from('offline_sync_queue')
        .insert({
          operation_id: operation.id,
          table_name: operation.tableName,
          operation_type: operation.operationType,
          data: operation.data,
          status,
          retry_count: operation.retryCount,
          error_message: operation.lastError,
          created_at: operation.createdAt,
          synced_at: new Date().toISOString(),
        });
    } catch {
      // Ignore errors in logging
    }
  }

  /**
   * Cache data locally for offline access
   */
  async cacheData(key: string, data: any, expiresInMs: number = 3600000): Promise<void> {
    const cacheEntry = {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + expiresInMs,
    };

    const cached = await this.getAllCachedData();
    cached[key] = cacheEntry;
    await storage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(cached));
  }

  /**
   * Get cached data
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    const cached = await this.getAllCachedData();
    const entry = cached[key];

    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      // Expired - remove it
      delete cached[key];
      await storage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(cached));
      return null;
    }

    return entry.data as T;
  }

  /**
   * Get all cached data
   */
  private async getAllCachedData(): Promise<Record<string, any>> {
    try {
      const cachedStr = await storage.getItem(STORAGE_KEYS.CACHED_DATA);
      return cachedStr ? JSON.parse(cachedStr) : {};
    } catch {
      return {};
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.CACHED_DATA);
  }

  /**
   * Clear the sync queue
   */
  async clearQueue(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    this.notifyListeners();
  }

  /**
   * Get pending operations count
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Check if we're currently online
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }
}

export const offlineSyncService = new OfflineSyncService();

export default offlineSyncService;
