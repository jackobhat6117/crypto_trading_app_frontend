import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-2 md:pb-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
