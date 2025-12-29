import { Block, useNotebookStore } from '../../stores/notebook-store'

interface InputBlockProps {
  block: Block
  notebookId: string
}

export function TextInputBlock({ block, notebookId }: InputBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const isMultiline = block.metadata.multiline as boolean

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {(block.metadata.label as string) || 'Text Input'}
      </label>
      {isMultiline ? (
        <textarea
          value={block.content}
          onChange={(e) => updateBlock(notebookId, block.id, { content: e.target.value })}
          placeholder={(block.metadata.placeholder as string) || 'Enter text...'}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-deepnote-500 focus:border-transparent"
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={block.content}
          onChange={(e) => updateBlock(notebookId, block.id, { content: e.target.value })}
          placeholder={(block.metadata.placeholder as string) || 'Enter text...'}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-deepnote-500 focus:border-transparent"
        />
      )}
      <div className="text-xs text-slate-500">
        Variable: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">
          {(block.metadata.variableName as string) || 'text_input'}
        </code>
      </div>
    </div>
  )
}

export function NumberInputBlock({ block, notebookId }: InputBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {(block.metadata.label as string) || 'Number Input'}
      </label>
      <input
        type="number"
        value={block.content || '0'}
        onChange={(e) => updateBlock(notebookId, block.id, { content: e.target.value })}
        min={block.metadata.min as number}
        max={block.metadata.max as number}
        step={block.metadata.step as number}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-deepnote-500 focus:border-transparent"
      />
      <div className="text-xs text-slate-500">
        Variable: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">
          {(block.metadata.variableName as string) || 'number_input'}
        </code>
      </div>
    </div>
  )
}

export function CheckboxBlock({ block, notebookId }: InputBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const isChecked = block.content === 'true'

  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => updateBlock(notebookId, block.id, { content: String(e.target.checked) })}
        className="w-5 h-5 rounded border-slate-300 text-deepnote-500 focus:ring-deepnote-500"
      />
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {(block.metadata.label as string) || 'Checkbox'}
      </label>
      <span className="text-xs text-slate-500">
        → <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">
          {(block.metadata.variableName as string) || 'checkbox'}
        </code>
      </span>
    </div>
  )
}

export function SelectBlock({ block, notebookId }: InputBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const options = (block.metadata.options as string[]) || ['Option 1', 'Option 2', 'Option 3']

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {(block.metadata.label as string) || 'Select'}
      </label>
      <select
        value={block.content || options[0]}
        onChange={(e) => updateBlock(notebookId, block.id, { content: e.target.value })}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-deepnote-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="text-xs text-slate-500">
        Variable: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">
          {(block.metadata.variableName as string) || 'select'}
        </code>
      </div>
    </div>
  )
}

export function SliderBlock({ block, notebookId }: InputBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const min = (block.metadata.min as number) ?? 0
  const max = (block.metadata.max as number) ?? 100
  const step = (block.metadata.step as number) ?? 1
  const value = parseFloat(block.content) || min

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {(block.metadata.label as string) || 'Slider'}
        </label>
        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => updateBlock(notebookId, block.id, { content: e.target.value })}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-deepnote-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export function DateInputBlock({ block, notebookId }: InputBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {(block.metadata.label as string) || 'Date'}
      </label>
      <input
        type="date"
        value={block.content}
        onChange={(e) => updateBlock(notebookId, block.id, { content: e.target.value })}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-deepnote-500 focus:border-transparent"
      />
      <div className="text-xs text-slate-500">
        Variable: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">
          {(block.metadata.variableName as string) || 'date_input'}
        </code>
      </div>
    </div>
  )
}
