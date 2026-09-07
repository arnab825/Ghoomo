/**
 * Ghoomo Bounded In-Memory LRU (Least Recently Used) Cache
 * Implemented using a Doubly Linked List + Hash Map for O(1) read, O(1) write, and O(1) eviction.
 * Completely in-memory, Zero Redis dependency.
 */

interface LRUNode<K, V> {
  key: K;
  value: V;
  expiresAt: number;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly defaultTtlMs: number;
  private readonly cache = new Map<K, LRUNode<K, V>>();
  private head: LRUNode<K, V> | null = null;
  private tail: LRUNode<K, V> | null = null;

  constructor(capacity: number = 200, defaultTtlMs: number = 1000 * 60 * 30) {
    this.capacity = Math.max(1, capacity);
    this.defaultTtlMs = defaultTtlMs;
  }

  public get size(): number {
    return this.cache.size;
  }

  public get(key: K): V | null {
    const node = this.cache.get(key);
    if (!node) return null;

    // Check expiration
    if (Date.now() > node.expiresAt) {
      this.removeNode(node);
      this.cache.delete(key);
      return null;
    }

    // Move accessed node to head (most recently used)
    this.moveToHead(node);
    return node.value;
  }

  public set(key: K, value: V, ttlMs?: number): void {
    const existing = this.cache.get(key);
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);

    if (existing) {
      existing.value = value;
      existing.expiresAt = expiresAt;
      this.moveToHead(existing);
      return;
    }

    // Evict least recently used node if at capacity
    if (this.cache.size >= this.capacity && this.tail) {
      const lruKey = this.tail.key;
      this.removeNode(this.tail);
      this.cache.delete(lruKey);
    }

    const newNode: LRUNode<K, V> = {
      key,
      value,
      expiresAt,
      prev: null,
      next: null,
    };

    this.addToHead(newNode);
    this.cache.set(key, newNode);
  }

  public has(key: K): boolean {
    return this.get(key) !== null;
  }

  public delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;
    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  public clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
  }

  private moveToHead(node: LRUNode<K, V>): void {
    if (this.head === node) return;
    this.removeNode(node);
    this.addToHead(node);
  }
}
