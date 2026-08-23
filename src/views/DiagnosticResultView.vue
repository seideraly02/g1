<script setup lang="ts">
import { ArrowRight, RefreshCcw, Target, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProgressRing from '../components/ProgressRing.vue'
import { getGuestDiagnosticRecord } from '../features/session/sessionApplication'

const router = useRouter()
const route = useRoute()
const requestedSessionId = typeof route.query.session === 'string' ? route.query.session : undefined
const session = getGuestDiagnosticRecord(requestedSessionId)
const total = session?.questionIds.length ?? 0
const correct = session?.answers.filter((answer) => answer.isCorrect).length ?? 0
const incorrect = session?.answers.filter((answer) => answer.isCorrect === false).length ?? 0
const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
const elapsedSeconds =
  session?.completedAt && session.startedAt
    ? Math.max(
        0,
        Math.round((Date.parse(session.completedAt) - Date.parse(session.startedAt)) / 1000),
      )
    : 0
const elapsedLabel = `${Math.floor(elapsedSeconds / 60)} мин ${elapsedSeconds % 60} сек`
const isCompleted =
  session?.status === 'completed' && total === 5 && session.answers.length === total

const subjectNames: Record<string, string> = {
  history: 'Қазақстан тарихы',
  reading: 'Оқу сауаттылығы',
  'math-literacy': 'Математикалық сауаттылық',
  math: 'Математика',
  physics: 'Физика',
}
const subjectName = computed(() => {
  const subjectId = session?.selectedSubjectIds[0]
  return subjectId ? (subjectNames[subjectId] ?? 'Таңдалған пән') : 'Таңдалған пән'
})
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-[#f8f8f8] px-4 pb-4">
    <header class="safe-top flex min-h-[72px] shrink-0 items-end pb-3">
      <button
        class="icon-button -ml-1"
        type="button"
        aria-label="Жабу"
        @click="router.push({ name: 'welcome' })"
      >
        <X :size="21" />
      </button>
      <h1 class="ml-3 flex-1 text-[21px] font-[800] tracking-[-.025em]">Диагностика нәтижесі</h1>
      <span
        v-if="isCompleted"
        class="rounded-[10px] bg-[#edf4ff] px-2.5 py-1 text-[11px] font-[800] text-[#1f66d9]"
        >Алдын ала</span
      >
    </header>

    <main v-if="isCompleted" class="mx-auto flex w-full max-w-[560px] flex-1 flex-col pb-3">
      <div class="mt-6 flex justify-center">
        <ProgressRing :value="percentage" :size="136" :stroke="14" color="#1f66d9">
          <div class="text-center">
            <strong class="metric-value block text-[32px] font-[800] leading-none"
              >{{ correct }}/{{ total }}</strong
            >
            <span class="mt-2 block text-[11px] text-[#667085]">дұрыс жауап</span>
          </div>
        </ProgressRing>
      </div>

      <h2 class="mt-4 text-center text-[23px] font-[800] tracking-[-.02em]">Алғашқы бағыт дайын</h2>
      <p class="mt-2 text-center text-[14px] leading-6 text-[#667085]">
        {{ subjectName }} бойынша нәтижең — {{ percentage }}%. Бұл 5 сұрақтық бастапқы тексеру,
        нақты ҰБТ болжамы емес.
      </p>

      <div class="mt-5 grid grid-cols-3 gap-2">
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[20px] font-[850]">{{ correct }}</div>
          <div class="mt-1 text-[10px] text-[#667085]">дұрыс</div>
        </div>
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[20px] font-[850]">{{ incorrect }}</div>
          <div class="mt-1 text-[10px] text-[#667085]">қате</div>
        </div>
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[13px] font-[850]">{{ elapsedLabel }}</div>
          <div class="mt-1 text-[10px] text-[#667085]">уақыт</div>
        </div>
      </div>

      <p class="mt-3 rounded-[16px] bg-[#f0f3f8] p-3 text-[12px] leading-5 text-[#667085]">
        Күшті және әлсіз тақырыптарды анықтауға дерек жеткіліксіз. Бұл қорытынды үшін көбірек сұрақ
        орындау керек.
      </p>

      <section class="soft-card mt-6 flex items-start gap-3 p-4" aria-labelledby="result-next-step">
        <Target class="mt-0.5 shrink-0 text-[#1f66d9]" :size="23" />
        <div>
          <h2 id="result-next-step" class="text-[15px] font-[800]">Келесі қадам</h2>
          <p class="mt-1 text-[13px] leading-5 text-[#667085]">
            Күнделікті сұрақ санын таңдап, оқу мақсатын сақта.
          </p>
        </div>
      </section>

      <div class="mt-auto pt-6">
        <button
          class="primary-button min-h-[52px]"
          type="button"
          @click="router.push({ name: 'personal-plan', query: { session: session?.id } })"
        >
          Мақсатты баптау <ArrowRight :size="19" />
        </button>
        <button
          class="text-button mx-auto mt-2 flex min-h-11"
          type="button"
          @click="router.push({ name: 'subjects-onboarding' })"
        >
          <RefreshCcw :size="17" /> Басқа пәнді тексеру
        </button>
      </div>
    </main>

    <main
      v-else
      class="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center text-center"
    >
      <span class="grid size-14 place-items-center rounded-[16px] bg-[#edf4ff] text-[#1f66d9]"
        ><Target :size="25"
      /></span>
      <h2 class="mt-4 text-[21px] font-[800]">Аяқталған диагностика жоқ</h2>
      <p class="mt-2 text-[14px] leading-6 text-[#667085]">
        Нәтиже көру үшін пән таңдап, 5 сұраққа жауап бер.
      </p>
      <button
        class="primary-button mt-6 max-w-[320px]"
        type="button"
        @click="router.push({ name: 'subjects-onboarding' })"
      >
        Диагностиканы бастау
      </button>
    </main>
  </section>
</template>
