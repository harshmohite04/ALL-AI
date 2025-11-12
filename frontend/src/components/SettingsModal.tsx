import { useEffect } from 'react'
import { useSettings, type SettingsSection } from '../settings/SettingsContext'

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="py-3 border-b border-gray-700/50">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-200">{label}</div>
        <div className="ml-4">{children}</div>
      </div>
      {hint && <div className="mt-2 text-xs text-gray-400">{hint}</div>}
    </div>
  )
}

export default function SettingsModal() {
  const { isOpen, closeSettings, settings, setSettings, activeSection, openSettings } = useSettings()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSettings() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeSettings])

  if (!isOpen) return null

  const sections: { id: SettingsSection; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'personalization', label: 'Personalization', icon: '🎨' },
    { id: 'connected', label: 'Connected apps', icon: '🔗' },
    { id: 'data', label: 'Data controls', icon: '🗂️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'account', label: 'Account', icon: '👤' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={closeSettings} />

      {/* Panel */}
      <div className="relative w-full max-w-3xl mt-8 rounded-2xl bg-gray-900 text-white shadow-2xl border border-gray-700/60 overflow-hidden">
        <div className="flex h-[70vh]">
          {/* Left nav */}
          <div className="w-56 bg-gray-900/90 border-r border-gray-700/60 p-2 space-y-1">
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 text-gray-300"
              onClick={closeSettings}
              aria-label="Close settings"
            >✕</button>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => openSettings(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${activeSection===s.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/60'}`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-700/60 text-[10px]">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeSection === 'general' && (
              <div>
                <h2 className="text-base font-semibold">General</h2>
                <div className="mt-2 divide-y divide-gray-700/50">
                  <Row label="Theme">
                    <div className="flex items-center gap-2 text-sm">
                      <select
                        className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1"
                        value={settings.theme}
                        onChange={e => setSettings({ theme: e.target.value as any })}
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </Row>
                  <Row label="Accent color">
                    <select
                      className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                      value={settings.accent}
                      onChange={e => setSettings({ accent: e.target.value as any })}
                    >
                      <option value="default">Default</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="pink">Pink</option>
                      <option value="orange">Orange</option>
                    </select>
                  </Row>
                  <Row label="Language">
                    <select
                      className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                      value={settings.language}
                      onChange={e => setSettings({ language: e.target.value as any })}
                    >
                      <option value="auto">Auto-detect</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </Row>
                  <Row label="Spoken language" hint="For best results, select the language you mainly speak. If it's not listed, auto-detect may still work.">
                    <select
                      className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                      value={settings.spokenLanguage}
                      onChange={e => setSettings({ spokenLanguage: e.target.value as any })}
                    >
                      <option value="auto">Auto-detect</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                    </select>
                  </Row>
                  <Row label="Voice">
                    <select
                      className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
                      value={settings.voice || ''}
                      onChange={e => setSettings({ voice: e.target.value || null })}
                    >
                      <option value="">None</option>
                      <option value="spark">Spark</option>
                      <option value="calm">Calm</option>
                      <option value="bold">Bold</option>
                    </select>
                  </Row>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <h2 className="text-base font-semibold">Notifications</h2>
                <div className="mt-2 divide-y divide-gray-700/50">
                  <Row label="Desktop notifications">
                    <button
                      onClick={() => setSettings({ notifications: { ...settings.notifications, desktop: !settings.notifications.desktop }})}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${settings.notifications.desktop ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${settings.notifications.desktop ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </Row>
                  <Row label="Play sound">
                    <button
                      onClick={() => setSettings({ notifications: { ...settings.notifications, sound: !settings.notifications.sound }})}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${settings.notifications.sound ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${settings.notifications.sound ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </Row>
                </div>
              </div>
            )}

            {activeSection !== 'general' && activeSection !== 'notifications' && (
              <div className="text-sm text-gray-300">
                <h2 className="text-base font-semibold capitalize">{activeSection}</h2>
                <p className="mt-2 text-gray-400">This section is a placeholder. We can wire it up based on your requirements.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
