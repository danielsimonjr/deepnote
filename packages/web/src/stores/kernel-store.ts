import { create } from 'zustand'

export type KernelStatus = 'idle' | 'busy' | 'starting' | 'error' | 'disconnected'

interface ExecutionQueueItem {
  blockId: string
  code: string
}

interface KernelState {
  status: KernelStatus
  executionQueue: ExecutionQueueItem[]
  currentExecution: ExecutionQueueItem | null
  error: string | null
  setStatus: (status: KernelStatus) => void
  setError: (error: string | null) => void
  enqueue: (item: ExecutionQueueItem) => void
  dequeue: () => ExecutionQueueItem | null
  setCurrentExecution: (item: ExecutionQueueItem | null) => void
  clearQueue: () => void
}

export const useKernelStore = create<KernelState>((set, get) => ({
  status: 'disconnected',
  executionQueue: [],
  currentExecution: null,
  error: null,

  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),

  enqueue: (item) =>
    set((state) => ({
      executionQueue: [...state.executionQueue, item],
    })),

  dequeue: () => {
    const state = get()
    if (state.executionQueue.length === 0) return null
    const [item, ...rest] = state.executionQueue
    set({ executionQueue: rest })
    return item
  },

  setCurrentExecution: (item) => set({ currentExecution: item }),

  clearQueue: () => set({ executionQueue: [], currentExecution: null }),
}))
