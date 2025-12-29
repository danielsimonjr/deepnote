import { Sidebar } from './sidebar/Sidebar'
import { Toolbar } from './toolbar/Toolbar'
import { NotebookView } from './notebook/NotebookView'
import { useUIStore } from '../stores/ui-store'

export function Layout() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800">
          <NotebookView />
        </main>
      </div>
    </div>
  )
}
