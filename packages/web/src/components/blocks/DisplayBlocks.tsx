import { Block, useNotebookStore } from '../../stores/notebook-store'
import { ImageIcon, ArrowUpDown } from 'lucide-react'

interface DisplayBlockProps {
  block: Block
  notebookId: string
}

export function ImageBlock({ block, notebookId }: DisplayBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const imageUrl = block.content || (block.metadata.url as string)

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt={(block.metadata.alt as string) || 'Image'}
            className="max-w-full rounded-lg"
            style={{
              maxHeight: (block.metadata.maxHeight as string) || '400px',
            }}
          />
          <button
            onClick={() => updateBlock(notebookId, block.id, { content: '' })}
            className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8">
          <div className="text-center">
            <ImageIcon className="mx-auto mb-2 text-slate-400" size={32} />
            <input
              type="text"
              placeholder="Paste image URL..."
              className="w-full max-w-md px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateBlock(notebookId, block.id, {
                    content: (e.target as HTMLInputElement).value,
                  })
                }
              }}
            />
            <p className="mt-2 text-xs text-slate-500">Press Enter to load image</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function BigNumberBlock({ block, notebookId }: DisplayBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const value = block.content || '0'
  const label = (block.metadata.label as string) || 'Metric'
  const prefix = (block.metadata.prefix as string) || ''
  const suffix = (block.metadata.suffix as string) || ''
  const trend = block.metadata.trend as 'up' | 'down' | undefined
  const trendValue = (block.metadata.trendValue as string) || ''

  return (
    <div className="text-center p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">
        {prefix}
        <input
          type="text"
          value={value}
          onChange={(e) => updateBlock(notebookId, block.id, { content: e.target.value })}
          className="bg-transparent text-center w-auto border-b border-transparent hover:border-slate-300 focus:border-deepnote-500 focus:outline-none"
          style={{ width: `${Math.max(value.length, 1) + 1}ch` }}
        />
        {suffix}
      </p>
      {trend && trendValue && (
        <p
          className={`mt-2 text-sm flex items-center justify-center gap-1 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <ArrowUpDown size={14} className={trend === 'up' ? 'rotate-180' : ''} />
          {trendValue}
        </p>
      )}
    </div>
  )
}

export function ButtonBlock({ block, notebookId }: DisplayBlockProps) {
  const updateBlock = useNotebookStore((state) => state.updateBlock)
  const label = (block.metadata.label as string) || 'Click me'
  const variant = (block.metadata.variant as 'primary' | 'secondary' | 'danger') || 'primary'

  const variantStyles = {
    primary: 'bg-deepnote-500 hover:bg-deepnote-600 text-white',
    secondary: 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  }

  const handleClick = () => {
    // Increment click count in metadata
    const clicks = ((block.metadata.clicks as number) || 0) + 1
    updateBlock(notebookId, block.id, {
      metadata: { ...block.metadata, clicks },
      content: String(clicks),
    })
    // TODO: Execute associated code or trigger action
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleClick}
        className={`px-4 py-2 rounded-lg font-medium ${variantStyles[variant]}`}
      >
        {label}
      </button>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Clicks: {(block.metadata.clicks as number) || 0}
      </span>
    </div>
  )
}

export function TableBlock({ block }: DisplayBlockProps) {
  // Parse content as JSON table data
  let data: Record<string, unknown>[] = []
  try {
    if (block.content) {
      data = JSON.parse(block.content)
    }
  } catch {
    // Invalid JSON, show placeholder
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <p>No data to display</p>
        <p className="text-xs mt-1">Run a code or SQL block to populate this table</p>
      </div>
    )
  }

  const columns = Object.keys(data[0] || {})

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
          {data.slice(0, 100).map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-4 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300"
                >
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 100 && (
        <p className="text-center py-2 text-sm text-slate-500">
          Showing 100 of {data.length} rows
        </p>
      )}
    </div>
  )
}
