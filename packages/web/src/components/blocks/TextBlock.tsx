import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { type Block, useNotebookStore } from '../../stores/notebook-store'

interface TextBlockProps {
  block: Block
  notebookId: string
}

export function TextBlock({ block, notebookId }: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(!block.content)
  const updateBlock = useNotebookStore(state => state.updateBlock)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus on ENTERING edit mode rather than via `autoFocus`. Identical for a mouse user,
  // but autoFocus also steals focus on first paint, which yanks a screen reader out of
  // the surrounding document before it has announced anything.
  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
    }
  }, [isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBlock(notebookId, block.id, { content: e.target.value })
  }

  if (isEditing) {
    return (
      <div className='relative'>
        <textarea
          ref={textareaRef}
          value={block.content}
          onChange={handleChange}
          onBlur={() => block.content && setIsEditing(false)}
          placeholder='Write markdown here...'
          className='w-full min-h-[100px] p-2 text-sm font-mono bg-transparent border border-slate-200 dark:border-slate-700 rounded resize-y focus:outline-none focus:ring-1 focus:ring-deepnote-500 text-slate-800 dark:text-slate-200'
        />
        <div className='absolute bottom-2 right-2 text-xs text-slate-400'>Markdown supported</div>
      </div>
    )
  }

  return (
    // Deliberately NOT a semantic <button>: this wraps rendered markdown, which can
    // contain links, and the HTML content model forbids interactive descendants inside a
    // button — a link nested in a button is unreachable for keyboard and screen-reader
    // users, which is worse than the rule this suppresses. role + tabIndex + the key
    // handler give keyboard users the same affordance the click already gave the mouse.
    // biome-ignore lint/a11y/useSemanticElements: a <button> may not contain the links that rendered markdown can produce
    <div
      role='button'
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsEditing(true)
        }
      }}
      className='prose prose-sm dark:prose-invert max-w-none cursor-text min-h-[40px] p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50'
    >
      {block.content ? (
        <ReactMarkdown>{block.content}</ReactMarkdown>
      ) : (
        <p className='text-slate-400 italic'>Click to add text...</p>
      )}
    </div>
  )
}
