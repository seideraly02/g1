<script setup lang="ts">
import { MoonStar, RotateCcw, ShieldCheck, Target, TrendingUp, Trophy } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'

interface NotificationItem {
  id: number
  group: 'today' | 'yesterday'
  title: string
  description: string
  time: string
  unread: boolean
  tone: string
  icon: typeof Target
}

const settingsOpen = ref(false)
const notifications = ref<NotificationItem[]>([
  {
    id: 1,
    group: 'today',
    title: 'Бүгінге 5 сұрақ қалды — шамамен 3 минут',
    description: 'Жоспарды ыңғайлы уақытта жалғастырыңыз.',
    time: '10:30',
    unread: true,
    tone: 'bg-[#eef5ff] text-[#2869df]',
    icon: Target,
  },
  {
    id: 2,
    group: 'today',
    title: 'Қазақстан тарихы бойынша жаңа қайталау дайын',
    description: 'Тақырып: XX ғасырдағы Қазақстан · 3 сұрақ',
    time: '09:15',
    unread: true,
    tone: 'bg-[#fff9e9] text-[#d47a00]',
    icon: RotateCcw,
  },
  {
    id: 3,
    group: 'today',
    title: 'Математикадан дәлдік 6%-ға өсті',
    description: 'Соңғы жеті күндегі жақсы ілгерілеу.',
    time: '08:40',
    unread: false,
    tone: 'bg-[#ecfbf3] text-[#19a658]',
    icon: TrendingUp,
  },
  {
    id: 4,
    group: 'yesterday',
    title: 'Сіз «Зерде» лигасында 6-орынға көтерілдіңіз',
    description: 'Тағы бір жаттығу жоғары көтерілуге көмектеседі.',
    time: '19:20',
    unread: false,
    tone: 'bg-[#f5f0ff] text-[#8338e8]',
    icon: Trophy,
  },
  {
    id: 5,
    group: 'yesterday',
    title: 'Бүгін қысқа жаттығу жасауға болады',
    description: '5 сұрақ ыңғайлы ырғақты сақтауға көмектеседі.',
    time: '12:00',
    unread: false,
    tone: 'bg-[#eef5ff] text-[#2869df]',
    icon: MoonStar,
  },
])

const today = computed(() => notifications.value.filter((item) => item.group === 'today'))
const yesterday = computed(() => notifications.value.filter((item) => item.group === 'yesterday'))
const hasUnread = computed(() => notifications.value.some((item) => item.unread))

function markAllRead() {
  notifications.value = notifications.value.map((item) => ({ ...item, unread: false }))
}

function openNotification(id: number) {
  notifications.value = notifications.value.map((item) =>
    item.id === id ? { ...item, unread: false } : item,
  )
}
</script>

<template>
  <section class="screen-page min-h-[844px] bg-[#f8faff]">
    <AppHeader title="Хабарландырулар" back>
      <template #actions>
        <button
          class="min-h-9 border-0 bg-transparent px-1 text-[12px] font-[850] text-[#2869df]"
          type="button"
          :aria-expanded="settingsOpen"
          @click="settingsOpen = !settingsOpen"
        >
          Баптау
        </button>
      </template>
    </AppHeader>

    <div class="screen-content pt-3">
      <div
        v-if="settingsOpen"
        class="mb-2 rounded-xl border border-[#b9dcff] bg-[#eff6ff] px-3 py-2 text-[11px] leading-5 text-[#34516f]"
      >
        Хабарландырулардың түрі мен уақытын профильден өзгерте аласыз.
      </div>

      <div class="flex items-center gap-3 py-1">
        <span class="section-label">БҮГІН</span>
        <span class="h-px flex-1 bg-[#dce4ef]" />
        <button
          class="border-0 bg-transparent px-1 text-[11px] font-[850] text-[#2869df] disabled:text-[#98a6b9]"
          type="button"
          :disabled="!hasUnread"
          @click="markAllRead"
        >
          Барлығын оқылған деп белгілеу
        </button>
      </div>

      <button
        v-for="item in today"
        :key="item.id"
        class="grid w-full grid-cols-[34px_1fr_8px] gap-3 border-x-0 border-b border-t-0 border-[#e6ebf2] bg-transparent py-4 text-left"
        type="button"
        @click="openNotification(item.id)"
      >
        <span class="grid size-[34px] place-items-center rounded-xl" :class="item.tone">
          <component :is="item.icon" :size="19" />
        </span>
        <span class="min-w-0">
          <strong class="block text-[12px] leading-[1.35]">{{ item.title }}</strong>
          <span class="mt-1 block text-[10px] leading-4 text-[#536178]">{{ item.description }}</span>
          <span class="metric-value mt-1.5 block text-[10px] text-[#9aabc0]">{{ item.time }}</span>
        </span>
        <span v-if="item.unread" class="mt-1 size-2 rounded-full bg-[#2869df]" aria-label="Оқылмаған" />
      </button>

      <div class="flex items-center gap-3 pb-1 pt-4">
        <span class="section-label">КЕШЕ</span>
        <span class="h-px flex-1 bg-[#dce4ef]" />
      </div>

      <button
        v-for="item in yesterday"
        :key="item.id"
        class="grid w-full grid-cols-[34px_1fr_8px] gap-3 border-x-0 border-b border-t-0 border-[#e6ebf2] bg-transparent py-4 text-left"
        type="button"
        @click="openNotification(item.id)"
      >
        <span class="grid size-[34px] place-items-center rounded-xl" :class="item.tone">
          <component :is="item.icon" :size="19" />
        </span>
        <span class="min-w-0">
          <strong class="block text-[12px] leading-[1.35]">{{ item.title }}</strong>
          <span class="mt-1 block text-[10px] leading-4 text-[#536178]">{{ item.description }}</span>
          <span class="metric-value mt-1.5 block text-[10px] text-[#9aabc0]">{{ item.time }}</span>
        </span>
        <span v-if="item.unread" class="mt-1 size-2 rounded-full bg-[#2869df]" aria-label="Оқылмаған" />
      </button>

      <div class="mt-3 flex items-center gap-3 rounded-[18px] border border-[#b9dcff] bg-[#eff6ff] p-3">
        <ShieldCheck class="shrink-0" :size="21" />
        <span class="text-[11px] leading-5 text-[#536178]">
          Қысым жоқ: хабарландырулардың түрі мен уақытын өзгертуге болады.
        </span>
      </div>
    </div>

    <BottomNav active="home" />
  </section>
</template>
