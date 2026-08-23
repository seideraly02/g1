<script setup lang="ts">
import { Check, Info, Repeat2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import SampleDataNotice from '../components/SampleDataNotice.vue'
import { guestDiagnosticQuestionIds } from '../features/diagnostic/diagnosticSession'
import { startGuestDiagnostic } from '../features/session/sessionApplication'

interface ReviewTopic {
  id: string
  subject: string
  title: string
  detail: string
  completed: number
  total: number
  color: string
  chip: string
  done?: boolean
}

const router = useRouter()
const showInfo = ref(false)

const topics: ReviewTopic[] = [
  {
    id: 'history',
    subject: 'Қазақстан тарихы',
    title: 'XX ғасырдағы Қазақстан',
    detail: '3 белсенді қате · соңғы талпыныс кеше',
    completed: 2,
    total: 3,
    color: 'bg-[#1f66d9]',
    chip: 'bg-[#fff1c9] text-[#b65a09]',
  },
  {
    id: 'math',
    subject: 'Математика',
    title: 'Квадрат теңдеулер',
    detail: '2 белсенді қате · қазір қайталау керек',
    completed: 1,
    total: 3,
    color: 'bg-[#1f66d9]',
    chip: 'bg-[#f0e9ff] text-[#7434dc]',
  },
  {
    id: 'informatics',
    subject: 'Информатика',
    title: 'Сұрыптау алгоритмдері',
    detail: 'Барлық 3 қайталау аяқталды · тарихы қолжетімді',
    completed: 3,
    total: 3,
    color: 'bg-[#168653]',
    chip: 'bg-[#dcf8e7] text-[#15894a]',
    done: true,
  },
]

function startSubjectQuestions(topic: ReviewTopic) {
  const session = startGuestDiagnostic([topic.id], guestDiagnosticQuestionIds)
  router.push({ name: 'diagnostic', query: { session: session.id } })
}
</script>

<template>
  <section class="screen-page bg-[#f8f8f8]">
    <AppHeader title="Қателермен жұмыс" back>
      <template #actions>
        <button
          class="icon-button"
          type="button"
          aria-label="Қайталау туралы"
          :aria-expanded="showInfo"
          @click="showInfo = !showInfo"
        >
          <Info :size="20" />
        </button>
      </template>
    </AppHeader>

    <div class="screen-content pt-3">
      <SampleDataNotice class="mb-3" />
      <div class="flex items-center gap-4 rounded-[20px] border border-[#b9dcff] bg-[#eff6ff] p-4">
        <Repeat2 class="shrink-0 text-[#2869df]" :size="25" />
        <div>
          <h2 class="text-[13px] font-[850]">Қайталау қалай жұмыс істейді?</h2>
          <p class="mt-1 text-[11px] leading-5 text-[#536178]">
            Жауап бекігенше, сұрақты ұзарған аралықтармен қайта ұсынамыз.
          </p>
          <p v-if="showInfo" class="mt-1 text-[10px] leading-4 text-[#2869df]">
            Дұрыс жауап берген сайын келесі қайталау аралығы ұлғаяды.
          </p>
        </div>
      </div>

      <div class="mt-3">
        <h2 class="text-[17px] font-[900] tracking-[-.02em]">Қайталау үлгісі</h2>
        <p class="text-[11px] text-[#536178]">Төмендегі көрсеткіштер жеке тарихтан алынбаған.</p>
      </div>

      <div class="mt-3 space-y-2">
        <article v-for="topic in topics" :key="topic.id" class="card p-3.5">
          <div class="flex items-start justify-between gap-2">
            <span class="rounded-lg px-2 py-1 text-[10px] font-[850]" :class="topic.chip">
              {{ topic.subject }}
            </span>
            <span
              v-if="topic.done"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[#dcf8e7] px-3 py-2 text-[10px] font-[850] text-[#15894a]"
            >
              <Check :size="17" :stroke-width="2.5" />
              Бекітілді
            </span>
            <span v-else class="text-[10px] text-[#536178]">
              {{ topic.total }} қайталаудың {{ topic.completed }}-еуі
            </span>
          </div>

          <h3 class="mt-2 text-[14px] font-[850]">{{ topic.title }}</h3>
          <p class="mt-1 text-[10px] leading-4 text-[#536178]">{{ topic.detail }}</p>

          <div v-if="!topic.done" class="mt-3 flex items-center gap-2">
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#dfe6ef]">
              <div
                class="h-full rounded-full"
                :class="topic.color"
                :style="{ width: `${(topic.completed / topic.total) * 100}%` }"
              />
            </div>
            <button
              class="secondary-button min-h-[40px] w-auto px-4"
              type="button"
              @click="startSubjectQuestions(topic)"
            >
              Пән бойынша 5 сұрақ
            </button>
          </div>
        </article>
      </div>

      <div class="mt-3 flex items-center justify-between">
        <h2 class="text-[14px] font-[850]">Келесі қайталаулар</h2>
        <span class="text-[12px] text-[#536178]">Ертең · 5</span>
      </div>
    </div>

    <BottomNav active="training" />
  </section>
</template>
