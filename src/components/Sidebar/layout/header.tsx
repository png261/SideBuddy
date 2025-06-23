import { useEffect, useState } from 'react'
import { BsRobot } from 'react-icons/bs'
import { HiOutlineCog, HiX } from 'react-icons/hi'

const Header = () => {
  const [shortcut, setShortcut] = useState<string | null>(null)
  const onToggle = () => {
    chrome.runtime.sendMessage({ action: 'close-sidebar' })
  }

  const settingsPage = chrome.runtime.getURL('/src/pages/settings/index.html')

  const handleModifyShortcut = () => {
    chrome.tabs.update({ url: 'chrome://extensions/shortcuts' })
  }

  useEffect(() => {
    chrome.commands.getAll((commands) => {
      const command = commands.find(
        (command) => command.name === 'open-sidebar',
      )
      if (command) setShortcut(command.shortcut || null)
    })
  }, [])

  return (
    <div className="cdx-flex cdx-justify-between cdx-p-3.5 cdx-border-b dark:cdx-border-neutral-700/50 cdx-border-neutral-300">
      <h1 className="cdx-text-2xl cdx-flex cdx-items-center cdx-gap-2 cdx-m-0 cdx-p-0">
        <BsRobot className="cdx-text-blue-400" />
        SideBuddy
      </h1>

      <div className="cdx-flex cdx-text-neutral-500 cdx-gap-2 cdx-items-center">
        <a
          target="_blank"
          rel="noreferrer"
          tabIndex={0}
          className="cdx-text-xl"
          href={settingsPage}
        >
          <HiOutlineCog />
        </a>
        <button type="button" className="cdx-text-xl" onClick={onToggle}>
          <HiX />
        </button>
      </div>
    </div>
  )
}

export default Header
