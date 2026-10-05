import { Appointment } from '@/types'

/**
 * Creates a Google Calendar add event URL for the given appointment
 */
export function createGoogleCalendarUrl(
  appointment: Appointment,
  salonName: string = 'SALORA Salon',
  salonAddress: string = 'Emerald Heights, Linking Road, Mumbai'
): string {
  const [year, month, day] = appointment.date.split('-').map(Number)
  const [startH, startM] = appointment.startTime.split(':').map(Number)
  const [endH, endM] = appointment.endTime.split(':').map(Number)

  const startDate = new Date(Date.UTC(year, month - 1, day, startH, startM))
  const endDate = new Date(Date.UTC(year, month - 1, day, endH, endM))

  const pad = (n: number) => String(n).padStart(2, '0')
  const formatUtc = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
      d.getUTCHours()
    )}${pad(d.getUTCMinutes())}00Z`

  const datesParam = `${formatUtc(startDate)}/${formatUtc(endDate)}`
  const title = encodeURIComponent(`${appointment.serviceName} at ${salonName}`)
  const details = encodeURIComponent(
    `Appointment Reference: #${appointment.appointmentId || appointment.id}\nSpecialist: ${
      appointment.staffName
    }\nDuration: ${appointment.serviceDuration} mins\nPrice: ₹${appointment.price}`
  )
  const location = encodeURIComponent(salonAddress)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`
}

/**
 * Generates an iCalendar (.ics) string for Apple Calendar, Outlook, etc.
 */
export function generateIcsContent(
  appointment: Appointment,
  salonName: string = 'SALORA Salon',
  salonAddress: string = 'Emerald Heights, Linking Road, Mumbai'
): string {
  const [year, month, day] = appointment.date.split('-').map(Number)
  const [startH, startM] = appointment.startTime.split(':').map(Number)
  const [endH, endM] = appointment.endTime.split(':').map(Number)

  const startDate = new Date(year, month - 1, day, startH, startM)
  const endDate = new Date(year, month - 1, day, endH, endM)

  const pad = (n: number) => String(n).padStart(2, '0')
  const formatIcsTime = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(
      d.getMinutes()
    )}00`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SALORA Smart Salon//Booking Wizard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:appt-${appointment.id}-${Date.now()}@salora.in`,
    `DTSTAMP:${formatIcsTime(new Date())}Z`,
    `DTSTART:${formatIcsTime(startDate)}`,
    `DTEND:${formatIcsTime(endDate)}`,
    `SUMMARY:${appointment.serviceName} - ${salonName}`,
    `DESCRIPTION:Appointment Reference: #${appointment.appointmentId || appointment.id}\\nStylist: ${appointment.staffName}\\nDuration: ${appointment.serviceDuration} minutes\\nTotal: INR ${appointment.price}`,
    `LOCATION:${salonAddress}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/**
 * Triggers a browser download of an .ics calendar file
 */
export function downloadIcsFile(
  appointment: Appointment,
  salonName?: string,
  salonAddress?: string
): void {
  const icsData = generateIcsContent(appointment, salonName, salonAddress)
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `salora-appointment-${appointment.date}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
