/**
 * LocalStorage Adapter
 * 
 * This is a low-level storage adapter that provides a simple interface
 * for storing and retrieving data from browser localStorage.
 * 
 * IMPORTANT: This is a temporary implementation for development and testing.
 * In production, this should be replaced with:
 * - API calls to a backend server
 * - Database connections (PostgreSQL, MongoDB, etc.)
 * - Server-side session management
 * 
 * The adapter is designed to be isolated from domain types, making it easy
 * to swap implementations without affecting the repository layer.
 * 
 * SECURITY NOTES:
 * - Never store sensitive data (passwords, API keys) in localStorage
 * - localStorage is not secure and can be accessed by any script on the page
 * - Data in localStorage persists even after browser close
 * - This implementation should only be used for non-sensitive development data
 */

export type StorageData = string | number | boolean | null | object | unknown[];

export class LocalStorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'impact_') {
    this.prefix = prefix;
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get a value from localStorage
   */
  get<T extends StorageData>(key: string): T | null {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return null;
    }

    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);
      
      if (item === null) {
        return null;
      }

      // Parse JSON if it's an object or array
      if (item.startsWith('{') || item.startsWith('[')) {
        return JSON.parse(item) as T;
      }

      return item as T;
    } catch (error) {
      console.error(`Error getting from localStorage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Set a value in localStorage
   */
  set<T extends StorageData>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const fullKey = this.prefix + key;
      const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error(`Error setting to localStorage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Remove a value from localStorage
   */
  remove(key: string): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   */
  has(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const fullKey = this.prefix + key;
      return localStorage.getItem(fullKey) !== null;
    } catch (error) {
      console.error(`Error checking localStorage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all values with the adapter's prefix
   */
  clear(): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const keysToRemove: string[] = [];
      
      // Find all keys with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      // Remove all matching keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get all keys with the adapter's prefix
   */
  keys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }

      return keys;
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Get the size of stored data (in bytes)
   */
  getSize(): number {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      let totalSize = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
      return 0;
    }
  }
}

// Export a singleton instance with default prefix
export const localStorageAdapter = new LocalStorageAdapter('impact_');
