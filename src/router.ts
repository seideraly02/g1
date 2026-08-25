import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { shouldCheckAuthentication } from './config/authAccess'
import { useAuthStore } from './stores/authStore'
import { pinia } from './stores/pinia'

export type AppRouteName =
  | 'welcome'
  | 'register'
  | 'subjects-onboarding'
  | 'diagnostic'
  | 'diagnostic-result'
  | 'save-progress'
  | 'personal-plan'
  | 'home'
  | 'forecast'
  | 'subjects'
  | 'history-subject'
  | 'training'
  | 'mistakes'
  | 'training-result'
  | 'mock-exam'
  | 'progress'
  | 'rating'
  | 'streak'
  | 'profile'
  | 'notifications'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'welcome', component: () => import('./views/WelcomeView.vue') },
  { path: '/register', name: 'register', component: () => import('./views/RegistrationView.vue') },
  {
    path: '/onboarding/subjects',
    name: 'subjects-onboarding',
    component: () => import('./views/SubjectSelectView.vue'),
  },
  {
    path: '/diagnostic',
    name: 'diagnostic',
    component: () => import('./views/DiagnosticView.vue'),
  },
  {
    path: '/diagnostic/result',
    name: 'diagnostic-result',
    component: () => import('./views/DiagnosticResultView.vue'),
  },
  {
    path: '/onboarding/save',
    name: 'save-progress',
    component: () => import('./views/SaveProgressView.vue'),
  },
  {
    path: '/onboarding/plan',
    name: 'personal-plan',
    component: () => import('./views/PersonalPlanView.vue'),
  },
  { path: '/home', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/forecast', name: 'forecast', component: () => import('./views/ForecastView.vue') },
  { path: '/subjects', name: 'subjects', component: () => import('./views/SubjectsView.vue') },
  {
    path: '/subjects/history',
    name: 'history-subject',
    component: () => import('./views/HistorySubjectView.vue'),
  },
  { path: '/training', name: 'training', component: () => import('./views/TrainingView.vue') },
  {
    path: '/training/mistakes',
    name: 'mistakes',
    component: () => import('./views/MistakesView.vue'),
  },
  {
    path: '/training/result',
    name: 'training-result',
    component: () => import('./views/TrainingResultView.vue'),
  },
  { path: '/mock-exam', name: 'mock-exam', component: () => import('./views/MockExamView.vue') },
  { path: '/progress', name: 'progress', component: () => import('./views/ProgressView.vue') },
  { path: '/rating', name: 'rating', component: () => import('./views/RatingView.vue') },
  { path: '/streak', name: 'streak', component: () => import('./views/StreakView.vue') },
  { path: '/profile', name: 'profile', component: () => import('./views/ProfileView.vue') },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('./views/NotificationsView.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const isPublicRoute = to.name === 'welcome' || to.name === 'register'

  if (!shouldCheckAuthentication(isPublicRoute)) {
    return true
  }

  const auth = useAuthStore(pinia)
  await auth.ensureSession()

  if (!auth.isAuthenticated) {
    return { name: 'register', query: { mode: 'login', redirect: to.fullPath } }
  }

  return true
})
