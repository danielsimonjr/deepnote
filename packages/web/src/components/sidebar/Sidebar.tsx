import { FileText, Plus, Trash2, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useNotebookStore } from '../../stores/notebook-store'

export function Sidebar() {
  const { notebooks, activeNotebookId, setActiveNotebook, createNotebook, deleteNotebook } =
    useNotebookStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    if (newName.trim()) {
      createNotebook(newName.trim())
      setNewName('')
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewName('')
    }
  }

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notebooks</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            title="New notebook"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {isCreating && (
          <div className="mb-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newName.trim()) setIsCreating(false)
              }}
              placeholder="Notebook name..."
              className="w-full px-2 py-1.5 text-sm border border-deepnote-500 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-deepnote-500"
              autoFocus
            />
          </div>
        )}

        {notebooks.length === 0 && !isCreating ? (
          <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
            <FileText className="mx-auto mb-2 opacity-50" size={32} />
            <p>No notebooks yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-2 text-deepnote-500 hover:text-deepnote-600"
            >
              Create one
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {notebooks.map((notebook) => (
              <li key={notebook.id}>
                <button
                  onClick={() => setActiveNotebook(notebook.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left group ${
                    activeNotebookId === notebook.id
                      ? 'bg-deepnote-50 dark:bg-deepnote-900/30 text-deepnote-700 dark:text-deepnote-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${
                      activeNotebookId === notebook.id ? 'rotate-90' : ''
                    }`}
                  />
                  <FileText size={14} />
                  <span className="flex-1 truncate">{notebook.name}</span>
                  {notebook.isDirty && (
                    <span className="w-2 h-2 rounded-full bg-orange-400" title="Unsaved changes" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotebook(notebook.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    title="Delete notebook"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        Deepnote Local v0.1.0
      </div>
    </aside>
  )
}
