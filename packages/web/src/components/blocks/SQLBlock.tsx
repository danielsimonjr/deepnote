import Editor from '@monaco-editor/react'
import { Database } from 'lucide-react'
import { Block, useNotebookStore } from '../../stores/notebook-store'
import { useUIStore } from '../../stores/ui-store'

interface SQLBlockProps {
  block: Block
  notebookId: string
}

export function SQLBlock({ block, notebookId }: SQLBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const theme = useUIStore((state) => state.theme)

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateBlock(notebookId, block.id, { content: value })
    }
  }

  // Get database connection from metadata
  const databaseName = (block.metadata.database as string) || 'No database selected'

  return (
    <div>
      {/* Database Selector */}
      <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded text-sm">
        <Database size={14} className="text-slate-500" />
        <select
          value={(block.metadata.database as string) || ''}
          onChange={(e) =>
            updateBlock(notebookId, block.id, {
              metadata: { ...block.metadata, database: e.target.value },
            })
          }
          className="flex-1 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Select database...</option>
          <option value="default">Default Connection</option>
        </select>
      </div>

      {/* SQL Editor */}
      <div className="min-h-[80px] border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
        <Editor
          height="auto"
          minHeight="80px"
          language="sql"
          value={block.content}
          onChange={handleChange}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
            wordWrap: 'on',
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'auto',
            },
          }}
        />
      </div>

      {/* Variable Name */}
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Store result as:</span>
        <input
          type="text"
          value={(block.metadata.variableName as string) || 'df'}
          onChange={(e) =>
            updateBlock(notebookId, block.id, {
              metadata: { ...block.metadata, variableName: e.target.value },
            })
          }
          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono focus:outline-none focus:ring-1 focus:ring-deepnote-500"
        />
      </div>
    </div>
  )
}
