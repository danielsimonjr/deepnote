import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Block, useNotebookStore } from '../../stores/notebook-store'

interface TextBlockProps {
  block: Block
  notebookId: string
}

export function TextBlock({ block, notebookId }: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(!block.content)
  const updateBlock = useNotebookStore((state) => state.updateBlock)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBlock(notebookId, block.id, { content: e.target.value })
  }

  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          value={block.content}
          onChange={handleChange}
          onBlur={() => block.content && setIsEditing(false)}
          placeholder="Write markdown here..."
          className="w-full min-h-[100px] p-2 text-sm font-mono bg-transparent border border-slate-200 dark:border-slate-700 rounded resize-y focus:outline-none focus:ring-1 focus:ring-deepnote-500 text-slate-800 dark:text-slate-200"
          autoFocus
        />
        <div className="absolute bottom-2 right-2 text-xs text-slate-400">
          Markdown supported
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="prose prose-sm dark:prose-invert max-w-none cursor-text min-h-[40px] p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50"
    >
      {block.content ? (
        <ReactMarkdown>{block.content}</ReactMarkdown>
      ) : (
        <p className="text-slate-400 italic">Click to add text...</p>
      )}
    </div>
  )
}
