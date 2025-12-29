import { create } from 'zustand'

export interface BlockOutput {
  type: 'text' | 'error' | 'image' | 'html' | 'table'
  content: string
  executionCount?: number
}

export interface Block {
  id: string
  type: 'code' | 'sql' | 'text' | 'image' | 'big-number' | 'text-input' | 'number-input' | 'checkbox' | 'select' | 'slider' | 'date-input' | 'file-upload' | 'button' | 'chart' | 'table'
  content: string
  outputs: BlockOutput[]
  metadata: Record<string, unknown>
  isExecuting?: boolean
}

export interface Notebook {
  id: string
  name: string
  blocks: Block[]
  isDirty: boolean
}

interface NotebookState {
  notebooks: Notebook[]
  activeNotebookId: string | null
  getActiveNotebook: () => Notebook | null
  setActiveNotebook: (id: string | null) => void
  createNotebook: (name: string) => string
  updateNotebook: (id: string, updates: Partial<Notebook>) => void
  deleteNotebook: (id: string) => void
  addBlock: (notebookId: string, block: Omit<Block, 'id'>, afterBlockId?: string) => string
  updateBlock: (notebookId: string, blockId: string, updates: Partial<Block>) => void
  deleteBlock: (notebookId: string, blockId: string) => void
  moveBlock: (notebookId: string, blockId: string, newIndex: number) => void
  setBlockExecuting: (notebookId: string, blockId: string, isExecuting: boolean) => void
  setBlockOutput: (notebookId: string, blockId: string, outputs: BlockOutput[]) => void
}

const generateId = () => crypto.randomUUID()

export const useNotebookStore = create<NotebookState>((set, get) => ({
  notebooks: [],
  activeNotebookId: null,

  getActiveNotebook: () => {
    const state = get()
    return state.notebooks.find((n) => n.id === state.activeNotebookId) ?? null
  },

  setActiveNotebook: (id) => set({ activeNotebookId: id }),

  createNotebook: (name) => {
    const id = generateId()
    const newNotebook: Notebook = {
      id,
      name,
      blocks: [
        {
          id: generateId(),
          type: 'code',
          content: '# Start coding here\nprint("Hello, Deepnote!")',
          outputs: [],
          metadata: {},
        },
      ],
      isDirty: false,
    }
    set((state) => ({
      notebooks: [...state.notebooks, newNotebook],
      activeNotebookId: id,
    }))
    return id
  },

  updateNotebook: (id, updates) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === id ? { ...n, ...updates, isDirty: true } : n
      ),
    })),

  deleteNotebook: (id) =>
    set((state) => ({
      notebooks: state.notebooks.filter((n) => n.id !== id),
      activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId,
    })),

  addBlock: (notebookId, block, afterBlockId) => {
    const blockId = generateId()
    set((state) => ({
      notebooks: state.notebooks.map((n) => {
        if (n.id !== notebookId) return n
        const newBlock: Block = { ...block, id: blockId }
        if (afterBlockId) {
          const index = n.blocks.findIndex((b) => b.id === afterBlockId)
          const newBlocks = [...n.blocks]
          newBlocks.splice(index + 1, 0, newBlock)
          return { ...n, blocks: newBlocks, isDirty: true }
        }
        return { ...n, blocks: [...n.blocks, newBlock], isDirty: true }
      }),
    }))
    return blockId
  },

  updateBlock: (notebookId, blockId, updates) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === notebookId
          ? {
              ...n,
              blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
              isDirty: true,
            }
          : n
      ),
    })),

  deleteBlock: (notebookId, blockId) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === notebookId
          ? { ...n, blocks: n.blocks.filter((b) => b.id !== blockId), isDirty: true }
          : n
      ),
    })),

  moveBlock: (notebookId, blockId, newIndex) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) => {
        if (n.id !== notebookId) return n
        const blocks = [...n.blocks]
        const currentIndex = blocks.findIndex((b) => b.id === blockId)
        if (currentIndex === -1) return n
        const [block] = blocks.splice(currentIndex, 1)
        blocks.splice(newIndex, 0, block)
        return { ...n, blocks, isDirty: true }
      }),
    })),

  setBlockExecuting: (notebookId, blockId, isExecuting) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === notebookId
          ? {
              ...n,
              blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, isExecuting } : b)),
            }
          : n
      ),
    })),

  setBlockOutput: (notebookId, blockId, outputs) =>
    set((state) => ({
      notebooks: state.notebooks.map((n) =>
        n.id === notebookId
          ? {
              ...n,
              blocks: n.blocks.map((b) =>
                b.id === blockId ? { ...b, outputs, isExecuting: false } : b
              ),
            }
          : n
      ),
    })),
}))
