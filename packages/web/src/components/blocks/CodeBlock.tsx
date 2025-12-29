import Editor from '@monaco-editor/react'
import { Block, useNotebookStore } from '../../stores/notebook-store'
import { useUIStore } from '../../stores/ui-store'

interface CodeBlockProps {
  block: Block
  notebookId: string
}

export function CodeBlock({ block, notebookId }: CodeBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const theme = useUIStore((state) => state.theme)

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateBlock(notebookId, block.id, { content: value })
    }
  }

  return (
    <div className="min-h-[100px] border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
      <Editor
        height="auto"
        minHeight="100px"
        language="python"
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
  )
}
