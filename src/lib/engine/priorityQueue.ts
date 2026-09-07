/**
 * Ghoomo Priority Queue / Min-Heap
 * High-performance deterministic binary heap for scoring and routing next best actions.
 * Time Complexity: Insert O(log N), Extract-Min O(log N), Peek O(1).
 */

export interface ScoredCandidate<T> {
  item: T;
  priorityScore: number; // Lower score = higher execution priority
  secondaryTieBreaker?: number;
}

export class MinPriorityQueue<T> {
  private heap: ScoredCandidate<T>[] = [];

  public get size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public push(item: T, priorityScore: number, secondaryTieBreaker = 0): void {
    this.heap.push({ item, priorityScore, secondaryTieBreaker });
    this.bubbleUp(this.heap.length - 1);
  }

  public peek(): ScoredCandidate<T> | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  public pop(): ScoredCandidate<T> | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return root;
  }

  private compare(a: ScoredCandidate<T>, b: ScoredCandidate<T>): number {
    if (a.priorityScore !== b.priorityScore) {
      return a.priorityScore - b.priorityScore;
    }
    return a.secondaryTieBreaker! - b.secondaryTieBreaker!;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[parentIndex];
        this.heap[parentIndex] = temp;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (
        leftChild < length &&
        this.compare(this.heap[leftChild], this.heap[smallest]) < 0
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < length &&
        this.compare(this.heap[rightChild], this.heap[smallest]) < 0
      ) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[smallest];
        this.heap[smallest] = temp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}
