import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export type AppRouteName =
  | 'welcome'
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
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
