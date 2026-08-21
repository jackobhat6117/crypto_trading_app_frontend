import { useCallback, useEffect, useState } from 'react'
import { AppNotification, authService } from '../services/authService'

const POLL_MS = 30_000

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const list = await authService.getNotifications()
      setNotifications(list)
      setError('')
    } catch {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(true), POLL_MS)
    return () => window.clearInterval(timer)
  }, [refresh])

  const unreadCount = notifications.filter((item) => !item.read).length

  const markRead = async (id: string) => {
    const current = notifications.find((item) => item._id === id)
    if (!current || current.read) return
    setNotifications((list) => list.map((item) => (item._id === id ? { ...item, read: true } : item)))
    try {
      await authService.markNotificationRead(id)
      await refresh(true)
    } catch {
      await refresh(true)
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0) return
    setNotifications((list) => list.map((item) => ({ ...item, read: true })))
    try {
      await authService.markNotificationsRead()
      await refresh(true)
    } catch {
      await refresh(true)
    }
  }

  return { notifications, unreadCount, loading, error, refresh, markRead, markAllRead }
}
