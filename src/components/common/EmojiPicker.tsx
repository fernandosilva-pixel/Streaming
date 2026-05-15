'use client'

import { useEffect, useRef } from 'react'

const EMOJIS = [
  '😀','😂','😍','😎','🤩','😭','😡','🥵','😴','🤔',
  '👏','👍','👎','🙌','🤝','💪','🫶','🔥','💥','⚡',
  '⚽','🏆','🥇','🎯','🎉','🎊','📣','🚀','💣','🫡',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','❌','✅',
  '😤','🤣','😬','🥴','😏','🤯','🥶','😇','🤭','😮',
  '🦁','🐯','🐺','🦊','🐸','🦅','💀','👻','🤡','👾',
]

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 rounded-2xl p-2 shadow-2xl"
      style={{
        background: '#12121A',
        border: '1px solid rgba(255,106,0,0.25)',
        width: 260,
      }}
    >
      <div className="grid grid-cols-10 gap-0.5">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            type="button"
            onClick={() => { onSelect(emoji) }}
            className="flex items-center justify-center w-6 h-6 rounded-lg text-base hover:bg-white/10 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
