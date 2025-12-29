import { Layout } from './components/Layout'
import { useUIStore } from './stores/ui-store'

function App() {
  const theme = useUIStore((state) => state.theme)

  return (
    <div className={theme}>
      <Layout />
    </div>
  )
}

export default App
