'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Share, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import html2canvas from 'html2canvas'

const getColorClass = (color: string) => {
  switch (color) {
    case 'red': return 'bg-red-200'
    case 'yellow': return 'bg-yellow-200'
    case 'green': return 'bg-green-200'
    case 'blue': return 'bg-blue-200'
    case 'purple': return 'bg-purple-200'
    case 'pink': return 'bg-pink-200'
    default: return 'bg-gray-200'
  }
}

interface CalendarEvent {
  id: string
  dates: Date[]
  label: string
  color: string
}

const colorOptions = [
  { value: 'red', label: 'Red' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
]

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [dragSelection, setDragSelection] = useState<{
    start: Date | null,
    end: Date | null,
    isSelecting: boolean,
    tempColor?: string
  }>({
    start: null,
    end: null,
    isSelecting: false,
    tempColor: 'blue'
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newEventLabel, setNewEventLabel] = useState('')
  const [newEventColor, setNewEventColor] = useState('blue')
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [screenWidth, setScreenWidth] = useState<number>(0)
  const calendarRef = useRef<HTMLDivElement>(null)
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDateMouseDown = (date: Date) => {
    setDragSelection({
      start: date,
      end: date,
      isSelecting: true,
      tempColor: newEventColor
    })
  }

  const handleDateMouseEnter = (date: Date) => {
    if (dragSelection.isSelecting) {
      setDragSelection(prev => ({
        ...prev,
        end: date
      }))
    }
  }

  const handleDateMouseUp = () => {
    if (dragSelection.start && dragSelection.end) {
      const selectedRange = getDatesInRange(dragSelection.start, dragSelection.end)
      setSelectedDates(selectedRange)
      setIsDialogOpen(true)
    }
    setDragSelection({
      start: null,
      end: null,
      isSelecting: false
    })
  }

  const isDateInDragSelection = (date: Date) => {
    if (!dragSelection.start || !dragSelection.end) return false;

    const start = new Date(Math.min(dragSelection.start.getTime(), dragSelection.end.getTime()));
    const end = new Date(Math.max(dragSelection.start.getTime(), dragSelection.end.getTime()));

    return date >= start && date <= end;
  }

  const renderDays = () => {
    return days.map(({ date, isCurrentMonth }, index) => {
      const isSelected = isDateSelected(date)
      const isInDragSelection = isDateInDragSelection(date)

      return (
        <div
          key={index}
          className={cn(
            "relative p-1 sm:p-2 text-center cursor-pointer transition-colors h-8 sm:h-10",
            isCurrentMonth ? "text-foreground" : "text-muted-foreground",
            (isSelected || isInDragSelection) && "bg-primary/20"
          )}
          onMouseDown={() => handleDateMouseDown(date)}
          onMouseEnter={() => handleDateMouseEnter(date)}
          onMouseUp={handleDateMouseUp}
          onTouchStart={() => handleDateMouseDown(date)}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
            if (targetElement) {
              const dateAttribute = targetElement.getAttribute('data-date');
              if (dateAttribute) {
                handleDateMouseEnter(new Date(parseInt(dateAttribute)));
              }
            }
          }}
          onTouchEnd={handleDateMouseUp}
          data-date={date.getTime()}
        >
          <span className="relative z-20 inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs sm:text-base">
            {date.getDate()}
          </span>
        </div>
      )
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevDate = new Date(year, month, -i)
      days.unshift({ date: prevDate, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  // const handleDateClick = (date: Date) => {
  //   if (!isSelecting) {
  //     setIsSelecting(true)
  //     setSelectedDates([date])
  //   } else {
  //     const newDates = getDatesInRange(selectedDates[0], date)
  //     setSelectedDates(newDates)
  //     setIsSelecting(false)
  //     setIsDialogOpen(true)
  //   }
  // }

  const getDatesInRange = (start: Date, end: Date) => {
    const dates: Date[] = []
    const startDate = new Date(Math.min(start.getTime(), end.getTime()))
    const endDate = new Date(Math.max(start.getTime(), end.getTime()))

    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  const handleAddEvent = () => {
    if (selectedDates.length > 0 && newEventLabel) {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        dates: selectedDates,
        label: newEventLabel,
        color: newEventColor
      }
      setEvents([...events, newEvent])
      setSelectedDates([])
      setNewEventLabel('')
      setIsDialogOpen(false)
    }
  }

  const handleEditEvent = () => {
    if (editingEvent) {
      const updatedEvents = events.map(event =>
        event.id === editingEvent.id ? editingEvent : event
      )
      setEvents(updatedEvents)
      setEditingEvent(null)
      setIsEditDialogOpen(false)
    }
  }

  const handleRemoveEvent = () => {
    if (editingEvent) {
      const updatedEvents = events.filter(event => event.id !== editingEvent.id)
      setEvents(updatedEvents)
      setEditingEvent(null)
      setIsEditDialogOpen(false)
    }
  }

  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate =>
      selectedDate.getDate() === date.getDate() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getFullYear() === date.getFullYear()
    )
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      event.dates.some(eventDate =>
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate)
      if (direction === 'prev') {
        newDate.setMonth(prevDate.getMonth() - 1)
      } else {
        newDate.setMonth(prevDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const handleLongPressStart = useCallback((event: CalendarEvent, index: number) => {
    longPressTimeoutRef.current = setTimeout(() => {
      setDraggedEvent(event)
      setDragStart(index)
      setDragEnd(index)
    }, 500)
  }, [])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
    }
  }, [])

  const handleDrag = useCallback((index: number) => {
    if (draggedEvent) {
      setDragEnd(index)
    }
  }, [draggedEvent])

  const handleDragEnd = useCallback(() => {
    if (draggedEvent && dragStart !== null && dragEnd !== null) {
      const newDates = getDatesInRange(days[dragStart].date, days[dragEnd].date)
      const updatedEvent = { ...draggedEvent, dates: newDates }
      const updatedEvents = events.map(event =>
        event.id === draggedEvent.id ? updatedEvent : event
      )
      setEvents(updatedEvents)
    }
    setDraggedEvent(null)
    setDragStart(null)
    setDragEnd(null)
  }, [draggedEvent, dragStart, dragEnd, days, events])

  const handleShare = async () => {
    if (calendarRef.current) {
      try {
        const canvas = await html2canvas(calendarRef.current, {
          useCORS: true,
          scale: window.devicePixelRatio,
          logging: false,
        });
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'calendar.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        const text = "Check out my calendar this month!";
      } catch (error) {
        console.error('Error sharing calendar:', error);
        alert('Failed to share calendar. Please try again.');
      }
    }
  };

  const renderEventCapsules = () => {
    const capsules: JSX.Element[] = []

    // Existing event capsules
    events.forEach((event, eventIndex) => {
      let startIndex = -1
      let endIndex = -1

      days.forEach((day, index) => {
        const isEventDate = event.dates.some(eventDate =>
          eventDate.getDate() === day.date.getDate() &&
          eventDate.getMonth() === day.date.getMonth() &&
          eventDate.getFullYear() === day.date.getFullYear()
        )

        if (isEventDate && startIndex === -1) {
          startIndex = index
        }

        if (isEventDate) {
          endIndex = index
        }

        if ((!isEventDate || index === days.length - 1) && startIndex !== -1) {
          capsules.push(
            <React.Fragment key={`event-${event.id}-${eventIndex}-${startIndex}`}>
              {createCapsule(startIndex, endIndex, event, eventIndex, event.id === hoveredEventId)}
            </React.Fragment>
          )
          startIndex = -1
          endIndex = -1
        }
      })
    })

    // Add drag selection capsule if active
    if (dragSelection.isSelecting && dragSelection.start && dragSelection.end) {
      const dragCapsule = createDragSelectionCapsule()
      if (dragCapsule) {
        capsules.push(dragCapsule)
      }
    }

    return capsules
  }

  const createDragSelectionCapsule = () => {
    if (!dragSelection.start || !dragSelection.end) return null

    const start = new Date(Math.min(dragSelection.start.getTime(), dragSelection.end.getTime()))
    const end = new Date(Math.max(dragSelection.start.getTime(), dragSelection.end.getTime()))

    let startIndex = -1
    let endIndex = -1

    days.forEach((day, index) => {
      const isInRange = day.date >= start && day.date <= end

      if (isInRange && startIndex === -1) {
        startIndex = index
      }

      if (isInRange) {
        endIndex = index
      }
    })

    if (startIndex === -1 || endIndex === -1) return null

    return createCapsule(
      startIndex,
      endIndex,
      {
        id: 'drag-selection',
        dates: getDatesInRange(start, end),
        label: '',
        color: dragSelection.tempColor || 'blue'
      },
      0,
      false,
      true // Add a flag to indicate it's a temporary drag selection
    )
  }

  const createCapsule = (
    startIndex: number,
    endIndex: number,
    event: CalendarEvent,
    eventIndex: number,
    isHovered: boolean,
    isDragSelection: boolean = false
  ): JSX.Element => {
    const startRow = Math.floor(startIndex / 7)
    const endRow = Math.floor(endIndex / 7)

    return (
      <>
        {Array.from({ length: endRow - startRow + 1 }, (_, row) => {
          const currentRow = startRow + row
          const rowStartIndex = currentRow === startRow ? startIndex : currentRow * 7
          const rowEndIndex = currentRow === endRow ? endIndex : (currentRow + 1) * 7 - 1

          const rowHeight = screenWidth < 640 ? 32 : 40
          const topOffset = screenWidth < 640 ? 28 : 34

          return (
            <div
              key={`capsule-${event.id}-${currentRow}`}
              className={cn(
                "absolute z-10 cursor-move transition-all duration-300",
                getColorClass(event.color),
                currentRow === startRow && "rounded-l-full",
                currentRow === endRow && "rounded-r-full",
                isHovered && "z-20 animate-pulse",
                isDragSelection && "opacity-50" // Add a visual indication for drag selection
              )}
              style={{
                left: `calc(${(rowStartIndex % 7) * 14.28}% + 2px)`,
                top: `calc(${currentRow * rowHeight}px + ${topOffset}px)`,
                width: `calc(${((rowEndIndex % 7) - (rowStartIndex % 7) + 1) * 14.28}% - 4px)`,
                height: `${screenWidth < 640 ? '20px' : '24px'}`,
              }}
            ></div>
          )
        })}
      </>
    )
  }

  const renderEventLabels = () => {
    return events.map((event, index) => {
      const startDate = event.dates[0]
      const startIndex = days.findIndex(day =>
        day.date.getDate() === startDate.getDate() &&
        day.date.getMonth() === startDate.getMonth() &&
        day.date.getFullYear() === startDate.getFullYear()
      )

      if (startIndex === -1) return null

      const row = Math.floor(startIndex / 7)
      const col = startIndex % 7

      const rowHeight = screenWidth < 640 ? 32 : 40
      const labelY = `${row * rowHeight + 20}px`
      const labelOffset = screenWidth < 640 ? '80px' : '120px'

      const labelX = col < 3 ? '100%' : '0%'
      const arrowStartX = col < 3 ? '0%' : '100%'
      const arrowStartY = '50%'
      const arrowEndX = `${col * 14.28 + 7.14}%`
      const arrowEndY = `${row * rowHeight + 20}px`

      return (
        <div
          key={event.id}
          className="absolute"
          style={{
            top: labelY,
            [col < 3 ? 'left' : 'right']: `-${labelOffset}`
          }}
        >
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              setEditingEvent(event)
              setIsEditDialogOpen(true)
            }}
          >
            <div
              className={`w-4 h-4 rounded-full ${getColorClass(event.color)} flex-shrink-0`}
            ></div>
            <div
              className="bg-white px-2 py-1 rounded-full text-xs font-handwriting shadow-sm"
            >
              {event.label}
            </div>
          </div>
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
          >
            <path
              d={`M ${arrowStartX} ${arrowStartY} Q ${col < 3 ? '50%' : '150%'} ${arrowStartY}, ${arrowEndX} ${arrowEndY}`}
              fill="none"
              stroke={event.color}
              strokeWidth="1"
            />
          </svg>
        </div>
      )
    })
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-2 sm:p-4">
      <div
        className="border rounded-lg p-2 sm:p-4 bg-white relative"
        ref={calendarRef}
        onMouseUp={handleDateMouseUp}
        onTouchEnd={handleDateMouseUp}
      >
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="text-lg sm:text-2xl font-semibold">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 relative">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-medium text-xs sm:text-sm p-1 sm:p-2"
            >
              {day}
            </div>
          ))}
          
          {renderDays()}
          {renderEventCapsules()}
        </div>

        <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Your Events</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={() => {
                  setEditingEvent(event)
                  setIsEditDialogOpen(true)
                }}
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getColorClass(event.color)} mr-2`}></div>
                <span className="text-xs sm:text-sm">{event.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={handleShare}
        className="w-full mt-2 sm:mt-4 text-base sm:text-lg py-4 sm:py-6"
      >
        <Share className="h-4 w-4 sm:h-6 sm:w-6 mr-2" />
        Share on Twitter
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white shadow-lg rounded-lg p-6">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <Input
                id="label"
                value={newEventLabel}
                onChange={(e) => setNewEventLabel(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Color</Label>
              <RadioGroup
                value={newEventColor}
                onValueChange={setNewEventColor}
                className="flex flex-wrap gap-2 col-span-3"
              >
                {colorOptions.map((color) => (
                  <div key={color.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={color.value}
                      id={`color-${color.value}`}
                      className={cn(
                        "border-2",
                        color.value === newEventColor && "border-black",
                        getColorClass(color.value)
                      )}
                    />
                    <Label htmlFor={`color-${color.value}`}>{color.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white shadow-lg rounded-lg p-6">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-label" className="text-right">
                Label
              </Label>
              <Input
                id="edit-label"
                value={editingEvent?.label || ''}
                onChange={(e) => setEditingEvent(prev => prev ? { ...prev, label: e.target.value } : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Color</Label>
              <RadioGroup
                value={editingEvent?.color || ''}
                onValueChange={(value) => setEditingEvent(prev => prev ? { ...prev, color: value } : null)}
                className="flex flex-wrap gap-2 col-span-3"
              >
                {colorOptions.map((color) => (
                  <div key={color.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={color.value}
                      id={`edit-color-${color.value}`}
                      className={cn(
                        "border-2",
                        color.value === editingEvent?.color && "border-black",
                        getColorClass(color.value)
                      )}
                    />
                    <Label htmlFor={`edit-color-${color.value}`}>{color.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditEvent} className="mr-2">Save Changes</Button>
            <Button onClick={handleRemoveEvent} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}