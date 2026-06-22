export const ADMIN_TOUR_EVENT = 'uposa-admin:replay-tour'
export const ADMIN_HELP_EVENT = 'uposa-admin:open-page-help'

export function replayAdminTour() {
  window.dispatchEvent(new Event(ADMIN_TOUR_EVENT))
}

export function openAdminPageHelp() {
  window.dispatchEvent(new Event(ADMIN_HELP_EVENT))
}
