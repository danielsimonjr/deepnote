import { useNotebookStore } from '../../stores/notebook-store'
import { BlockContainer } from '../blocks/BlockContainer'
import { FileText } from 'lucide-react'

export function NotebookView() {
  const activeNotebook = useNotebookStore((state) => state.getActiveNotebook())

  if (!activeNotebook) {
    return <EmptyState />
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        {activeNotebook.name}
      </h1>
      <div className="space-y-4">
        {activeNotebook.blocks.map((block, index) => (
          <BlockContainer
            key={block.id}
            block={block}
            notebookId={activeNotebook.id}
            index={index}
          />
        ))}
      </div>
      <AddBlockButton notebookId={activeNotebook.id} />
    </div>
  )
}

function EmptyState() {
  const createNotebook = useNotebookStore((state) => state.createNotebook)

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <FileText className="mx-auto mb-4 text-slate-400" size={64} />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
          No notebook selected
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Select a notebook from the sidebar or create a new one
        </p>
        <button
          onClick={() => createNotebook('Untitled Notebook')}
          className="px-4 py-2 bg-deepnote-500 hover:bg-deepnote-600 text-white rounded-lg font-medium"
        >
          Create New Notebook
        </button>
      </div>
    </div>
  )
}

function AddBlockButton({ notebookId }: { notebookId: string }) {
  const addBlock = useNotebookStore((state) => state.addBlock)

  const blockTypes = [
    { type: 'code' as const, label: 'Code' },
    { type: 'text' as const, label: 'Text' },
    { type: 'sql' as const, label: 'SQL' },
  ]

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      {blockTypes.map(({ type, label }) => (
        <button
          key={type}
          onClick={() =>
            addBlock(notebookId, {
              type,
              content: '',
              outputs: [],
              metadata: {},
            })
          }
          className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        >
          + {label}
        </button>
      ))}
    </div>
  )
}
