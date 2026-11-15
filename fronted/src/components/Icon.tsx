import type { SVGProps } from 'react'

type IconName =
  | 'home'
  | 'radiation'
  | 'heart'
  | 'wellness'
  | 'kit'
  | 'pet'
  | 'shield'
  | 'alert'
  | 'clock'
  | 'chevron'
  | 'check'
  | 'search'
  | 'upload'
  | 'trash'
  | 'plus'
  | 'minus'
  | 'pulse'
  | 'scan'
  | 'spark'
  | 'users'
  | 'vr'
  | 'moon'
  | 'package'

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    radiation: <><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 1 8.66 5l-5.2 3A4 4 0 0 0 12 8ZM3.34 7A10 10 0 0 0 12 22v-6a4 4 0 0 1-3.46-6ZM12 22a10 10 0 0 0 8.66-15l-5.2 3A4 4 0 0 1 12 16Z"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
    wellness: <><path d="M9.5 4.5A3.5 3.5 0 0 1 13 1v6a3 3 0 0 1-3 3H5a4 4 0 0 1 4.5-5.5Z"/><path d="M14.5 19.5A3.5 3.5 0 0 1 11 23v-6a3 3 0 0 1 3-3h5a4 4 0 0 1-4.5 5.5Z"/><path d="M4.5 14.5A3.5 3.5 0 0 1 1 11h6a3 3 0 0 1 3 3v5a4 4 0 0 1-5.5-4.5ZM19.5 9.5A3.5 3.5 0 0 1 23 13h-6a3 3 0 0 1-3-3V5a4 4 0 0 1 5.5 4.5Z"/></>,
    kit: <><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 10v7M8.5 13.5h7"/></>,
    pet: <><circle cx="12" cy="12" r="8"/><path d="m6.5 6-2-3M17.5 6l2-3M9 11h.01M15 11h.01M9 15c1.5 1.2 4.5 1.2 6 0"/></>,
    shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>,
    alert: <><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5"/><path d="M4 20h16"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    minus: <path d="M5 12h14"/>,
    pulse: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
    scan: <><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><circle cx="12" cy="12" r="3"/></>,
    spark: <path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6Z"/>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6M16 6a3 3 0 0 1 0 6M17 14c2.7.4 4 2.4 4 5"/></>,
    vr: <><path d="M2 12c0-3 1-5 4-5h12c3 0 4 2 4 5v3a3 3 0 0 1-3 3h-2l-3-3h-4l-3 3H5a3 3 0 0 1-3-3Z"/><path d="M8 11h.01M16 11h.01"/></>,
    moon: <path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/>,
    package: <><path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 7 9 5v10l9-5V7M7.5 4.5l9 5"/></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
}
