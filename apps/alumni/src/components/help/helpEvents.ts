export const ALUMNI_TOUR_EVENT = 'uposa-alumni:replay-tour'
export const ALUMNI_HELP_EVENT = 'uposa-alumni:open-page-help'

export function replayAlumniTour() {
  window.dispatchEvent(new Event(ALUMNI_TOUR_EVENT))
}

export function openAlumniPageHelp() {
  window.dispatchEvent(new Event(ALUMNI_HELP_EVENT))
}
