import { useState } from 'react'
import Auth from './auth'
import Chat from './chat'
import Header from './layout/header'
import Podcast from './podcast'
import { useSettings } from '../../hooks/useSettings'
import useThemeSync from '../../hooks/useThemeSync'

function Tabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <div className="cdx-flex cdx-border-b cdx-border-neutral-300 dark:cdx-border-neutral-700">
      {['chat', 'podcast'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`cdx-flex-1 cdx-p-2 cdx-text-center cdx-font-medium ${
            activeTab === tab
              ? 'cdx-border-b-2 cdx-border-blue-500 dark:cdx-border-blue-400'
              : 'cdx-text-neutral-500 hover:cdx-text-neutral-800 dark:hover:cdx-text-white'
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  )
}

function Sidebar() {
  const [settings] = useSettings()
  const [activeTab, setActiveTab] = useState('chat')
  useThemeSync()

  const isAuthenticated = Boolean(settings.chat.openAIKey)

  return (
    <div className="cdx-flex cdx-backdrop-blur-sm cdx-flex-col cdx-min-h-screen cdx-shadow-md cdx-border-l dark:!cdx-text-white dark:cdx-border-neutral-800 cdx-border-neutral-200 cdx-top-0 cdx-right-0 cdx-w-[400px] cdx-h-full dark:cdx-bg-neutral-800/90 cdx-bg-neutral-100/90">
      <Header />

      {!isAuthenticated ? (
        <Auth />
      ) : (
        <>
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === 'chat' ? <Chat settings={settings} /> : <Podcast settings={settings} />}
        </>
      )}
    </div>
  )
}

export default Sidebar

