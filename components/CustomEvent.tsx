import React from 'react'
import { Event } from '@/app/types/calendar'

export const CustomEvent: React.FC<{ event: Event }> = ({ event }) => {
  return (
    <div
      style={{
        backgroundColor: event.color,
        color: 'white',
        padding: '2px 4px',
        borderRadius: '4px',
        fontSize: '0.8em',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {event.title}
    </div>
  )
}

