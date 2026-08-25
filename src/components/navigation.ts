import { BarChart3, BookOpen, Home, Play, UserRound } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { AppRouteName } from '../router'

export type PrimaryNavigationKey = 'home' | 'subjects' | 'training' | 'progress' | 'profile'

export interface PrimaryNavigationItem {
  key: PrimaryNavigationKey
  label: string
  route: AppRouteName
  matches: readonly AppRouteName[]
  icon: Component
}

export const primaryNavigationItems: readonly PrimaryNavigationItem[] = [
  { key: 'home', label: 'Басты бет', route: 'home', matches: ['home'], icon: Home },
  {
    key: 'subjects',
    label: 'Пәндер',
    route: 'subjects',
    matches: ['subjects', 'history-subject'],
    icon: BookOpen,
  },
  {
    key: 'training',
    label: 'Жаттығу',
    route: 'training',
    matches: ['training', 'mistakes', 'training-result'],
    icon: Play,
  },
  {
    key: 'progress',
    label: 'Ілгерілеу',
    route: 'progress',
    matches: ['progress', 'forecast', 'rating', 'streak'],
    icon: BarChart3,
  },
  {
    key: 'profile',
    label: 'Профиль',
    route: 'profile',
    matches: ['profile', 'notifications'],
    icon: UserRound,
  },
]

export function isWorkspaceRoute(routeName: unknown): boolean {
  if (typeof routeName !== 'string') return false

  if (routeName === 'admin') return true

  return primaryNavigationItems.some((item) => item.matches.includes(routeName as AppRouteName))
}

export function isNavigationItemActive(
  item: PrimaryNavigationItem,
  routeName: unknown,
  activeKey?: PrimaryNavigationKey,
): boolean {
  if (activeKey) return activeKey === item.key
  if (typeof routeName !== 'string') return false

  return item.matches.includes(routeName as AppRouteName)
}
