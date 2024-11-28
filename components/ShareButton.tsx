import React from 'react'
import html2canvas from 'html2canvas'
import { Button } from '@/components/ui/button'
import { Event } from '@/app/types/calendar'

interface ShareButtonProps {
  events: Event[]
}

export const ShareButton: React.FC<ShareButtonProps> = ({ events }) => {
  const handleShare = async () => {
    const calendarElement = document.querySelector('.rbc-calendar')
    if (calendarElement) {
      const canvas = await html2canvas(calendarElement as HTMLElement)
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = 'calendar.png'
      link.click()
    }
  }

  return <Button onClick={handleShare}>Share Calendar</Button>
}

