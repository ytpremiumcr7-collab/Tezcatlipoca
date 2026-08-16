// Platform detection for desktop vs mobile builds
export const IS_MOBILE = typeof __MOBILE__ !== 'undefined' ? __MOBILE__ : false
export const PLATFORM = typeof __PLATFORM__ !== 'undefined' ? __PLATFORM__ : 'desktop'

// Runtime detection (for responsive within same build)
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function isSmallScreen(): boolean {
  return window.innerWidth < 768
}
