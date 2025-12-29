import {
  Play,
  Plus,
  Save,
  Download,
  Upload,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Square,
  RotateCcw,
} from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'
import { useNotebookStore } from '../../stores/notebook-store'
import { useKernelStore } from '../../stores/kernel-store'

export function Toolbar() {
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useUIStore()
  const activeNotebook = useNotebookStore((state) => state.getActiveNotebook())
  const kernelStatus = useKernelStore((state) => state.status)

  const handleRunAll = () => {
    // TODO: Implement run all cells
    console.log('Run all cells')
  }

  const handleAddBlock = () => {
    if (!activeNotebook) return
    useNotebookStore.getState().addBlock(activeNotebook.id, {
      type: 'code',
      content: '',
      outputs: [],
      metadata: {},
    })
  }

  const handleSave = () => {
    // TODO: Implement save
    console.log('Save notebook')
  }

  const handleExport = () => {
    // TODO: Implement export
    console.log('Export notebook')
  }

  const handleImport = () => {
    // TODO: Implement import
    console.log('Import notebook')
  }

  const handleInterrupt = () => {
    // TODO: Implement kernel interrupt
    console.log('Interrupt kernel')
  }

  const handleRestart = () => {
    // TODO: Implement kernel restart
    console.log('Restart kernel')
  }

  return (
    <header className="h-12 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-2 bg-white dark:bg-slate-900">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
      </button>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <button
        onClick={handleRunAll}
        disabled={!activeNotebook || kernelStatus === 'busy'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-deepnote-500 hover:bg-deepnote-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
      >
        <Play size={14} />
        Run All
      </button>

      <button
        onClick={handleInterrupt}
        disabled={kernelStatus !== 'busy'}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50"
        title="Interrupt kernel"
      >
        <Square size={16} />
      </button>

      <button
        onClick={handleRestart}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        title="Restart kernel"
      >
        <RotateCcw size={16} />
      </button>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <button
        onClick={handleAddBlock}
        disabled={!activeNotebook}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm disabled:opacity-50"
      >
        <Plus size={16} />
        Add Block
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <KernelStatusIndicator status={kernelStatus} />
      </div>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <button
        onClick={handleImport}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        title="Import notebook"
      >
        <Upload size={18} />
      </button>

      <button
        onClick={handleExport}
        disabled={!activeNotebook}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50"
        title="Export notebook"
      >
        <Download size={18} />
      </button>

      <button
        onClick={handleSave}
        disabled={!activeNotebook}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50"
        title="Save notebook"
      >
        <Save size={18} />
      </button>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

      <button
        onClick={toggleTheme}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </header>
  )
}

function KernelStatusIndicator({ status }: { status: string }) {
  const colors = {
    idle: 'bg-green-500',
    busy: 'bg-yellow-500 animate-pulse',
    starting: 'bg-blue-500 animate-pulse',
    error: 'bg-red-500',
    disconnected: 'bg-slate-400',
  }

  const labels = {
    idle: 'Kernel Idle',
    busy: 'Kernel Busy',
    starting: 'Kernel Starting',
    error: 'Kernel Error',
    disconnected: 'Disconnected',
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-600 dark:text-slate-400">
      <span className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || colors.disconnected}`} />
      <span>{labels[status as keyof typeof labels] || 'Unknown'}</span>
    </div>
  )
}
