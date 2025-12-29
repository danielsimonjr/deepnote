import { Play, Trash2, GripVertical, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Block, useNotebookStore } from '../../stores/notebook-store'
import { useUIStore } from '../../stores/ui-store'
import { CodeBlock } from './CodeBlock'
import { TextBlock } from './TextBlock'
import { SQLBlock } from './SQLBlock'
import {
  TextInputBlock,
  NumberInputBlock,
  CheckboxBlock,
  SelectBlock,
  SliderBlock,
  DateInputBlock,
} from './InputBlocks'
import { ImageBlock, BigNumberBlock, ButtonBlock, TableBlock } from './DisplayBlocks'

interface BlockContainerProps {
  block: Block
  notebookId: string
  index: number
}

export function BlockContainer({ block, notebookId, index }: BlockContainerProps) {
  const { activeBlockId, setActiveBlock } = useUIStore()
  const { deleteBlock } = useNotebookStore()
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const isActive = activeBlockId === block.id

  const handleRun = () => {
    // TODO: Execute block via kernel
    console.log('Run block:', block.id)
  }

  const handleDelete = () => {
    deleteBlock(notebookId, block.id)
  }

  const blockTypes = [
    { type: 'code', label: 'Code' },
    { type: 'text', label: 'Text' },
    { type: 'sql', label: 'SQL' },
    { type: 'text-input', label: 'Text Input' },
    { type: 'number-input', label: 'Number Input' },
    { type: 'checkbox', label: 'Checkbox' },
    { type: 'select', label: 'Select' },
    { type: 'slider', label: 'Slider' },
    { type: 'date-input', label: 'Date' },
    { type: 'image', label: 'Image' },
    { type: 'big-number', label: 'Big Number' },
    { type: 'button', label: 'Button' },
    { type: 'table', label: 'Table' },
  ]

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 rounded-lg border ${
        isActive
          ? 'border-deepnote-500 ring-1 ring-deepnote-500'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
      onClick={() => setActiveBlock(block.id)}
    >
      {/* Block Header */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-slate-100 dark:border-slate-800">
        <button
          className="p-1 cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            {block.type.toUpperCase()}
            <ChevronDown size={12} />
          </button>
          {showTypeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-10">
              {blockTypes.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => {
                    useNotebookStore.getState().updateBlock(notebookId, block.id, {
                      type: type as Block['type'],
                    })
                    setShowTypeMenu(false)
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500">[{index + 1}]</span>

        <div className="flex-1" />

        {block.isExecuting && (
          <span className="text-xs text-yellow-600 dark:text-yellow-400 animate-pulse">
            Running...
          </span>
        )}

        {(block.type === 'code' || block.type === 'sql') && (
          <button
            onClick={handleRun}
            disabled={block.isExecuting}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50"
            title="Run block"
          >
            <Play size={14} />
          </button>
        )}

        <button
          onClick={handleDelete}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
          title="Delete block"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Block Content */}
      <div className="p-2">
        <BlockContent block={block} notebookId={notebookId} />
      </div>

      {/* Block Output */}
      {block.outputs.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-2">
          <BlockOutput outputs={block.outputs} />
        </div>
      )}
    </div>
  )
}

function BlockContent({ block, notebookId }: { block: Block; notebookId: string }) {
  switch (block.type) {
    case 'code':
      return <CodeBlock block={block} notebookId={notebookId} />
    case 'text':
      return <TextBlock block={block} notebookId={notebookId} />
    case 'sql':
      return <SQLBlock block={block} notebookId={notebookId} />
    case 'text-input':
      return <TextInputBlock block={block} notebookId={notebookId} />
    case 'number-input':
      return <NumberInputBlock block={block} notebookId={notebookId} />
    case 'checkbox':
      return <CheckboxBlock block={block} notebookId={notebookId} />
    case 'select':
      return <SelectBlock block={block} notebookId={notebookId} />
    case 'slider':
      return <SliderBlock block={block} notebookId={notebookId} />
    case 'date-input':
      return <DateInputBlock block={block} notebookId={notebookId} />
    case 'image':
      return <ImageBlock block={block} notebookId={notebookId} />
    case 'big-number':
      return <BigNumberBlock block={block} notebookId={notebookId} />
    case 'button':
      return <ButtonBlock block={block} notebookId={notebookId} />
    case 'table':
      return <TableBlock block={block} notebookId={notebookId} />
    default:
      return (
        <div className="text-sm text-slate-500">
          Block type "{block.type}" not implemented yet
        </div>
      )
  }
}

function BlockOutput({ outputs }: { outputs: Block['outputs'] }) {
  return (
    <div className="space-y-2">
      {outputs.map((output, i) => (
        <div key={i} className="text-sm">
          {output.type === 'error' ? (
            <pre className="text-red-600 dark:text-red-400 font-mono text-xs whitespace-pre-wrap bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {output.content}
            </pre>
          ) : output.type === 'image' ? (
            <img src={output.content} alt="Output" className="max-w-full rounded" />
          ) : output.type === 'html' ? (
            <div dangerouslySetInnerHTML={{ __html: output.content }} />
          ) : (
            <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 p-2 rounded">
              {output.content}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}
