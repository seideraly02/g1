<script setup lang="ts">
import { Check, WandSparkles } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import {
  getStudyPlan,
  saveStudyPlan,
  validateStudyPlan,
  type DailyQuestionGoal,
  type StudyPlanDraft,
  type StudyPlanErrors,
} from '../features/plan/studyPlanApplication'
import { getGuestDiagnosticRecord } from '../features/session/sessionApplication'

const router = useRouter()
const route = useRoute()
const savedPlan = getStudyPlan()
const dailyGoal = ref<DailyQuestionGoal>(savedPlan?.dailyQuestionGoal ?? 20)
const subjectNames: Record<string, string> = {
  history: 'Қазақстан тарихы',
  reading: 'Оқу сауаттылығы',
  'math-literacy': 'Математикалық сауаттылық',
  math: 'Математика',
  physics: 'Физика',
}
const requestedSessionId = typeof route.query.session === 'string' ? route.query.session : undefined
const latestDiagnostic = requestedSessionId ? getGuestDiagnosticRecord(requestedSessionId) : null
const selectedSubjectId =
  latestDiagnostic?.selectedSubjectIds[0] ?? savedPlan?.selectedSubjectIds[0]
const draft = reactive<StudyPlanDraft>({
  subjectId: selectedSubjectId ?? '',
  currentScore: savedPlan ? String(savedPlan.currentScore) : '',
  targetScore: savedPlan ? String(savedPlan.targetScore) : '',
  examDate: savedPlan?.examDate ?? '',
  dailyQuestionGoal: dailyGoal.value,
})
const errors = ref<StudyPlanErrors>({})
const saveError = ref('')
const goals: Array<{ value: DailyQuestionGoal; minutes: number }> = [
  { value: 10, minutes: 5 },
  { value: 20, minutes: 12 },
  { value: 30, minutes: 18 },
  { value: 50, minutes: 30 },
]

function createPlan() {
  draft.dailyQuestionGoal = dailyGoal.value
  errors.value = validateStudyPlan(draft)
  saveError.value = ''
  if (Object.keys(errors.value).length > 0) return

  if (!saveStudyPlan(draft)) {
    saveError.value = 'Жоспарды сақтау мүмкін болмады. Қайта көр.'
    return
  }
  void router.push({ name: 'home' })
}
</script>

<template>
  <section class="screen-page flex flex-col bg-[#f8f8f8] pb-4">
    <AppHeader title="Оқу мақсаты" back>
      <template #actions>
        <button class="text-button min-h-11" type="button" @click="router.push({ name: 'home' })">
          Өткізу
        </button>
      </template>
    </AppHeader>

    <div class="px-4 lg:px-[clamp(40px,6vw,96px)]">
      <div class="mt-1 grid h-1.5 shrink-0 grid-cols-5 gap-1.5" aria-label="5 қадамның 4-қадамы">
        <span
          v-for="step in 5"
          :key="step"
          class="rounded-full"
          :class="step <= 4 ? 'bg-[#1f66d9]' : 'bg-[#dfe6ef]'"
        />
      </div>
    </div>

    <main
      class="min-h-0 flex-1 overflow-y-auto px-4 pb-3 lg:grid lg:grid-cols-2 lg:content-start lg:gap-x-[clamp(40px,6vw,96px)] lg:px-[clamp(40px,6vw,96px)]"
    >
      <div class="mt-4 flex items-center justify-between lg:col-start-1">
        <span class="text-[11px] font-[850] uppercase tracking-[.03em] text-[#1f66d9]">
          5 қадамның 4-қадамы
        </span>
        <span class="text-[12px] text-[#536178]">Күнделікті мақсат</span>
      </div>

      <h2
        class="mt-3 text-[25px] font-[900] leading-[1.18] tracking-[-.025em] text-[#0d1730] lg:col-start-1 lg:text-[32px]"
      >
        Күніне қанша сұрақ шешу ыңғайлы?
      </h2>
      <p class="mt-2 text-[14px] leading-[1.4] text-[#536178] lg:col-start-1">
        Мақсатты профильде өзгертуге болады. Өзіңе ыңғайлы қарқыннан баста.
      </p>

      <div class="mt-4 grid grid-cols-4 gap-2 lg:col-start-1">
        <button
          v-for="goal in goals"
          :key="goal.value"
          type="button"
          class="min-h-[78px] rounded-[18px] border bg-white px-1 transition-all"
          :class="
            dailyGoal === goal.value
              ? 'border-[#1f66d9] bg-[#edf4ff] shadow-[0_0_0_3px_rgba(31,102,217,.09)]'
              : 'border-[#dce3ec]'
          "
          :aria-pressed="dailyGoal === goal.value"
          @click="dailyGoal = goal.value"
        >
          <strong
            class="block text-[22px] font-[900] leading-none"
            :class="dailyGoal === goal.value ? 'text-[#1f66d9]' : 'text-[#111b34]'"
          >
            {{ goal.value }}
          </strong>
          <span class="mt-2 block whitespace-nowrap text-[10px] text-[#536178]"
            >≈ {{ goal.minutes }} минут</span
          >
        </button>
      </div>

      <div
        class="mt-4 flex items-center rounded-[18px] border border-[#add4ff] bg-[#edf5ff] px-6 py-5 lg:col-start-1"
      >
        <WandSparkles
          :size="23"
          :stroke-width="2.1"
          class="shrink-0 text-[#1f66d9]"
          aria-hidden="true"
        />
        <div class="ml-5">
          <strong class="block text-[13px] font-[850] text-[#111b34]"
            >Оңтайлы бастау: {{ dailyGoal }}</strong
          >
          <p class="mt-1 text-[12px] leading-[1.35] text-[#536178]">
            Бұл баптаулар сақталады және оқу қарқыныңды есте ұстауға көмектеседі.
          </p>
        </div>
      </div>

      <fieldset
        class="mt-5 space-y-3 rounded-[20px] border border-[#dce3ec] bg-white p-4 lg:col-start-2 lg:row-start-1 lg:row-span-5 lg:mt-4 lg:p-6"
      >
        <legend class="px-1 text-[13px] font-[800]">Мақсат баптаулары</legend>
        <label class="block text-[12px] font-[700]"
          >Дайындалатын пән
          <select
            v-model="draft.subjectId"
            class="mt-2 min-h-12 w-full rounded-[14px] border border-[#cbd5e1] bg-white px-3 text-[14px]"
          >
            <option value="" disabled>Пәнді таңда</option>
            <option v-for="(name, id) in subjectNames" :key="id" :value="id">{{ name }}</option>
          </select>
          <span v-if="errors.subjectId" class="mt-1 block text-[11px] text-[#c93645]">{{
            errors.subjectId
          }}</span>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block text-[12px] font-[700]"
            >Қазіргі нәтиже
            <input
              v-model="draft.currentScore"
              class="mt-2 min-h-12 w-full rounded-[14px] border border-[#cbd5e1] px-3 text-[14px]"
              inputmode="numeric"
              placeholder="Мысалы, 60"
            />
            <span v-if="errors.currentScore" class="mt-1 block text-[11px] text-[#c93645]">{{
              errors.currentScore
            }}</span>
          </label>
          <label class="block text-[12px] font-[700]"
            >Мақсат
            <input
              v-model="draft.targetScore"
              class="mt-2 min-h-12 w-full rounded-[14px] border border-[#cbd5e1] px-3 text-[14px]"
              inputmode="numeric"
              placeholder="Мысалы, 90"
            />
            <span v-if="errors.targetScore" class="mt-1 block text-[11px] text-[#c93645]">{{
              errors.targetScore
            }}</span>
          </label>
        </div>
        <label class="block text-[12px] font-[700]"
          >ҰБТ күні
          <input
            v-model="draft.examDate"
            type="date"
            class="mt-2 min-h-12 w-full rounded-[14px] border border-[#cbd5e1] px-3 text-[14px]"
          />
          <span v-if="errors.examDate" class="mt-1 block text-[11px] text-[#c93645]">{{
            errors.examDate
          }}</span>
        </label>
      </fieldset>
      <p v-if="saveError" class="mt-3 text-[12px] text-[#c93645] lg:col-start-2" role="alert">
        {{ saveError }}
      </p>
    </main>

    <div
      class="px-4 lg:grid lg:grid-cols-2 lg:gap-x-[clamp(40px,6vw,96px)] lg:px-[clamp(40px,6vw,96px)]"
    >
      <button
        class="primary-button mt-2 min-h-[52px] shrink-0 rounded-[16px] text-[16px] lg:col-start-2 lg:mt-0"
        type="button"
        @click="createPlan"
      >
        Мақсатты сақтау
        <Check :size="19" :stroke-width="2.4" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
