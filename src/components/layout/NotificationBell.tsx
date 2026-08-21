import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { AppNotification } from '../../services/authService'

function typeDot(type: AppNotification['type']) {
  if (type === 'success') return 'bg-green-500'
  if (type === 'warning') return 'bg-yellow-500'
  if (type === 'error') return 'bg-red-500'
  return 'bg-blue-500'
}

function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', { hour12: false })
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications()

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed right-3 top-14 z-50 flex max-h-[min(80vh,32rem)] w-[min(calc(100vw-1.5rem),24rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Notifications ({notifications.length})
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    void markAllRead()
                  }}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                </div>
              ) : error && notifications.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-500">{error}</p>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((item) => {
                    const isExpanded = expanded.has(item._id)
                    const long = item.message.length > 150
                    const body = long && !isExpanded ? `${item.message.slice(0, 150)}...` : item.message
                    return (
                      <div
                        key={item._id}
                        onClick={() => void markRead(item._id)}
                        className={`cursor-pointer p-4 transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          item.read ? '' : 'bg-indigo-50 dark:bg-indigo-900/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${typeDot(item.type)}`} />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                              {item.title}
                            </div>
                            <div className="whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-400">
                              {body}
                            </div>
                            {long && (
                              <button
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  toggleExpanded(item._id)
                                }}
                                className="mt-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {formatWhen(item.createdAt)}
                            </div>
                          </div>
                          {!item.read && (
                            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-600" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
