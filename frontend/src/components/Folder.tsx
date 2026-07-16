import { useState } from 'react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import './Folder.css'

type FolderProps = {
  className?: string
  color?: string
  items?: ReactNode[]
  size?: number
}

function darkenColor(hex: string, percent: number) {
  let color = hex.startsWith('#') ? hex.slice(1) : hex

  if (color.length === 3) {
    color = color
      .split('')
      .map((character) => character + character)
      .join('')
  }

  const num = Number.parseInt(color, 16)
  const r = Math.max(0, Math.min(255, Math.floor(((num >> 16) & 0xff) * (1 - percent))))
  const g = Math.max(0, Math.min(255, Math.floor(((num >> 8) & 0xff) * (1 - percent))))
  const b = Math.max(0, Math.min(255, Math.floor((num & 0xff) * (1 - percent))))

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`
}

export function Folder({ className = '', color = '#1D5FD1', items = [], size = 1 }: FolderProps) {
  const maxItems = 3
  const papers = items.slice(0, maxItems)
  const [open, setOpen] = useState(false)
  const [paperOffsets, setPaperOffsets] = useState(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
  )

  while (papers.length < maxItems) {
    papers.push(null)
  }

  function handleClick() {
    setOpen((currentOpen) => {
      if (currentOpen) {
        setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })))
      }

      return !currentOpen
    })
  }

  function handlePaperMouseMove(event: MouseEvent<HTMLDivElement>, index: number) {
    if (!open) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const offsetX = (event.clientX - centerX) * 0.12
    const offsetY = (event.clientY - centerY) * 0.12

    setPaperOffsets((currentOffsets) => {
      const nextOffsets = [...currentOffsets]
      nextOffsets[index] = { x: offsetX, y: offsetY }

      return nextOffsets
    })
  }

  function handlePaperMouseLeave(index: number) {
    setPaperOffsets((currentOffsets) => {
      const nextOffsets = [...currentOffsets]
      nextOffsets[index] = { x: 0, y: 0 }

      return nextOffsets
    })
  }

  return (
    <div className={className} style={{ transform: `scale(${size})` }}>
      <div
        aria-expanded={open}
        aria-label={open ? 'Close documents folder' : 'Open documents folder'}
        className={`rb-folder ${open ? 'rb-folder--open' : ''}`}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleClick()
          }
        }}
        role="button"
        style={
          {
            '--folder-back-color': darkenColor(color, 0.12),
            '--folder-color': color,
          } as CSSProperties
        }
        tabIndex={0}
      >
        <div className="rb-folder__back">
          {papers.map((item, index) => (
            <div
              className={`rb-folder__paper rb-folder__paper--${index + 1}`}
              key={index}
              onMouseLeave={() => handlePaperMouseLeave(index)}
              onMouseMove={(event) => handlePaperMouseMove(event, index)}
              style={
                open
                  ? ({
                      '--magnet-x': `${paperOffsets[index]?.x ?? 0}px`,
                      '--magnet-y': `${paperOffsets[index]?.y ?? 0}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {item}
            </div>
          ))}
          <div className="rb-folder__front" />
          <div className="rb-folder__front rb-folder__front--right" />
        </div>
      </div>
    </div>
  )
}
