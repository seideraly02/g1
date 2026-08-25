<script setup lang="ts">
import { ArrowLeft, ArrowRight, Plus, Search, ShieldCheck, Trash2 } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import {
  AdminApiError,
  adminRepository,
  type AdminOverviewDto,
  type AdminUsersPageDto,
  type CreateAdminQuestionInput,
} from '../services/api/apiAdminRepository'
import { subjectRepository, type SubjectDto } from '../services/api/apiSubjectRepository'

type AdminTab = 'overview' | 'users' | 'questions'

const tabs: ReadonlyArray<readonly [AdminTab, string]> = [
  ['overview', 'Шолу'],
  ['users', 'Пайдаланушылар'],
  ['questions', 'Сұрақ қосу'],
]

const activeTab = ref<AdminTab>('overview')
const overview = ref<AdminOverviewDto | null>(null)
const users = ref<AdminUsersPageDto | null>(null)
const subjects = ref<SubjectDto[]>([])
const loading = ref(true)
const usersLoading = ref(false)
const savingQuestion = ref(false)
const forbidden = ref(false)
const forbiddenPanel = ref<HTMLElement | null>(null)
const error = ref('')
const questionError = ref('')
const questionSuccess = ref('')
const search = ref('')
const appliedSearch = ref('')
const page = ref(1)
const question = ref<CreateAdminQuestionInput>({
  subjectId: '',
  topic: '',
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
})

const totalPages = computed(() =>
  users.value ? Math.max(1, Math.ceil(users.value.total / users.value.limit)) : 1,
)

function errorMessage(cause: unknown) {
  if (cause instanceof AdminApiError && cause.kind === 'forbidden') {
    forbidden.value = true
    return 'Бұл бөлімге кіруге рұқсат жоқ.'
  }
  return 'Деректерді жүктеу мүмкін болмады. Интернет байланысын тексер.'
}

async function loadUsers(nextPage = page.value, nextSearch = appliedSearch.value) {
  usersLoading.value = true
  error.value = ''
  try {
    users.value = await adminRepository.getUsers(nextSearch, nextPage, 20)
    page.value = nextPage
    appliedSearch.value = nextSearch
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    usersLoading.value = false
  }
}

async function loadAdmin() {
  loading.value = true
  forbidden.value = false
  error.value = ''
  try {
    const [nextOverview, nextUsers, nextSubjects] = await Promise.all([
      adminRepository.getOverview(),
      adminRepository.getUsers('', 1, 20),
      subjectRepository.getSubjects(),
    ])
    overview.value = nextOverview
    users.value = nextUsers
    subjects.value = nextSubjects
    question.value.subjectId = nextSubjects[0]?.id ?? ''
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally {
    loading.value = false
  }
}

onMounted(loadAdmin)

function applySearch() {
  void loadUsers(1, search.value.trim())
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > totalPages.value || usersLoading.value) return
  void loadUsers(nextPage)
}

function addOption() {
  if (question.value.options.length >= 6) return
  question.value.options.push('')
}

function removeOption(index: number) {
  if (question.value.options.length <= 2) return
  question.value.options.splice(index, 1)
  if (question.value.correctIndex > index) question.value.correctIndex -= 1
  else if (question.value.correctIndex === index) question.value.correctIndex = 0
}

async function createQuestion() {
  if (savingQuestion.value) return
  questionError.value = ''
  questionSuccess.value = ''
  savingQuestion.value = true
  try {
    const created = await adminRepository.createQuestion({
      ...question.value,
      options: [...question.value.options],
    })
    questionSuccess.value = `Сұрақ сақталды: ${created.topic}`
    question.value = {
      subjectId: question.value.subjectId,
      topic: '',
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
    }
  } catch (cause) {
    if (cause instanceof AdminApiError && cause.kind === 'forbidden') forbidden.value = true
    questionError.value =
      cause instanceof AdminApiError && cause.kind === 'forbidden'
        ? 'Бұл әрекетке рұқсат жоқ.'
        : 'Сұрақ сақталмады. Барлық өрісті тексеріп, қайталап көр.'
  } finally {
    savingQuestion.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('kk-KZ', { dateStyle: 'medium' }).format(new Date(value))
}

watch(forbidden, async (isForbidden) => {
  if (!isForbidden) return
  await nextTick()
  forbiddenPanel.value?.focus()
})
</script>

<template>
  <section class="screen-page w-full min-w-0 bg-[#f8f8f8]">
    <AppHeader title="Әкімшілік" />

    <div class="screen-content min-w-0 pt-3">
      <div
        class="flex items-center gap-2 rounded-[14px] bg-[#e9eef5] p-1"
        aria-label="Әкімшілік бөлімдері"
      >
        <button
          v-for="tab in tabs"
          :key="tab[0]"
          class="min-h-11 flex-1 rounded-[11px] border-0 px-2 text-[12px] font-[800]"
          :class="
            activeTab === tab[0]
              ? 'bg-white text-[#1f66d9] shadow-sm'
              : 'bg-transparent text-[#536178]'
          "
          type="button"
          :aria-pressed="activeTab === tab[0]"
          @click="activeTab = tab[0]"
        >
          {{ tab[1] }}
        </button>
      </div>

      <div
        v-if="loading"
        class="grid min-h-64 place-items-center text-[14px] text-[#667085]"
        role="status"
        aria-live="polite"
      >
        Деректер жүктеліп жатыр…
      </div>
      <section
        v-else-if="forbidden"
        ref="forbiddenPanel"
        class="mx-auto mt-16 max-w-md text-center"
        aria-labelledby="forbidden-heading"
        role="alert"
        tabindex="-1"
      >
        <ShieldCheck class="mx-auto text-[#98a6b9]" :size="40" aria-hidden="true" />
        <h2 id="forbidden-heading" class="mt-4 text-[19px] font-[900]">Кіруге рұқсат жоқ</h2>
        <p class="mt-2 text-[13px] leading-5 text-[#667085]">
          Бұл бөлім тек әкімші тіркелгісіне қолжетімді.
        </p>
      </section>
      <section v-else-if="error && !overview" class="mx-auto mt-16 max-w-md text-center">
        <p class="text-[14px] text-[#b4232a]" role="alert">{{ error }}</p>
        <button class="text-button mt-4 min-h-11" type="button" @click="loadAdmin">
          Қайталап көру
        </button>
      </section>

      <template v-else>
        <section
          v-if="activeTab === 'overview' && overview"
          class="mt-4"
          aria-labelledby="overview-heading"
        >
          <h2 id="overview-heading" class="text-[16px] font-[900]">Сайт көрсеткіштері</h2>
          <div class="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <article
              v-for="metric in [
                ['Барлық пайдаланушы', overview.totalUsers],
                ['Қазір онлайн', overview.onlineUsers],
                ['Офлайн', overview.offlineUsers],
                ['7 күнде тіркелген', overview.recentRegistrations],
                ['Диагностика саны', overview.diagnosticAttempts],
                ['7 күндегі диагностика', overview.recentDiagnosticAttempts],
              ]"
              :key="metric[0]"
              class="card p-4"
            >
              <p class="text-[11px] leading-4 text-[#667085]">{{ metric[0] }}</p>
              <p class="mt-2 text-[24px] font-[900] text-[#17223b]">{{ metric[1] }}</p>
            </article>
          </div>

          <div class="mt-5 flex items-center justify-between">
            <h2 class="text-[16px] font-[900]">Соңғы тіркелгендер</h2>
            <button class="text-button min-h-11" type="button" @click="activeTab = 'users'">
              Барлығын көру
            </button>
          </div>
          <div class="card mt-2 divide-y divide-[#e6ebf2] overflow-hidden">
            <div
              v-for="student in users?.users.slice(0, 5)"
              :key="student.id"
              class="flex items-center gap-3 px-4 py-3"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-[800]">
                  {{ student.firstName }} {{ student.lastName }}
                </p>
                <p class="mt-0.5 truncate text-[11px] text-[#667085]">
                  {{ student.city }} · {{ formatDate(student.createdAt) }}
                </p>
              </div>
              <span
                v-if="student.role === 'admin'"
                class="rounded-md bg-[#edf4ff] px-2 py-1 text-[10px] font-[800] text-[#1f66d9]"
                >Әкімші</span
              >
            </div>
            <p v-if="!users?.users.length" class="px-4 py-8 text-center text-[13px] text-[#667085]">
              Тіркелген пайдаланушы жоқ
            </p>
          </div>
        </section>

        <section v-if="activeTab === 'users'" class="mt-4" aria-labelledby="users-heading">
          <h2 id="users-heading" class="text-[16px] font-[900]">Пайдаланушылар</h2>
          <form class="relative mt-3" role="search" @submit.prevent="applySearch">
            <Search
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98a6b9]"
              :size="19"
              aria-hidden="true"
            />
            <input
              v-model="search"
              class="min-h-[50px] w-full rounded-[14px] border border-[#d7dee8] bg-white pl-11 pr-24 text-[14px]"
              type="search"
              maxlength="80"
              placeholder="Аты, қала немесе телефон"
              aria-label="Пайдаланушыны іздеу"
            />
            <button
              class="absolute inset-y-1.5 right-1.5 rounded-[10px] border-0 bg-[#1f66d9] px-4 text-[12px] font-[800] text-white"
              type="submit"
              :disabled="usersLoading"
            >
              Іздеу
            </button>
          </form>
          <p v-if="error" class="mt-3 text-[13px] text-[#b4232a]" role="alert">{{ error }}</p>
          <p
            v-if="usersLoading"
            class="mt-6 text-center text-[13px] text-[#667085]"
            role="status"
            aria-live="polite"
          >
            Тізім жүктеліп жатыр…
          </p>
          <div v-else class="card mt-3 divide-y divide-[#e6ebf2] overflow-hidden">
            <div
              v-for="student in users?.users"
              :key="student.id"
              class="px-4 py-3 sm:flex sm:items-center sm:gap-4"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-[800]">
                  {{ student.firstName }} {{ student.lastName }}
                </p>
                <p class="mt-1 truncate text-[11px] text-[#667085]">
                  {{ student.phone }} · {{ student.city }}
                </p>
              </div>
              <p class="mt-1 text-[11px] text-[#667085] sm:mt-0">
                {{ formatDate(student.createdAt) }}
              </p>
            </div>
            <p v-if="!users?.users.length" class="px-4 py-8 text-center text-[13px] text-[#667085]">
              Пайдаланушы табылмады
            </p>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <button
              class="icon-button"
              type="button"
              aria-label="Алдыңғы бет"
              :disabled="page <= 1 || usersLoading"
              @click="changePage(page - 1)"
            >
              <ArrowLeft :size="19" />
            </button>
            <span class="text-[12px] text-[#667085]">{{ page }} / {{ totalPages }}</span>
            <button
              class="icon-button"
              type="button"
              aria-label="Келесі бет"
              :disabled="page >= totalPages || usersLoading"
              @click="changePage(page + 1)"
            >
              <ArrowRight :size="19" />
            </button>
          </div>
        </section>

        <section
          v-if="activeTab === 'questions'"
          class="mx-auto mt-4 max-w-2xl"
          aria-labelledby="question-heading"
        >
          <h2 id="question-heading" class="text-[16px] font-[900]">Жаңа сұрақ</h2>
          <p class="mt-1 text-[12px] leading-5 text-[#667085]">
            Сұрақ жарияланғаннан кейін оқушы диагностикасында қолданылады.
          </p>
          <form class="card mt-3 space-y-4 p-4 sm:p-5" @submit.prevent="createQuestion">
            <label class="block text-[12px] font-[800]"
              >Пән<select
                v-model="question.subjectId"
                class="mt-2 min-h-[48px] w-full rounded-[12px] border border-[#d7dee8] bg-white px-3 text-[14px]"
                :disabled="savingQuestion"
                required
              >
                <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                  {{ subject.name }}
                </option>
              </select></label
            >
            <label class="block text-[12px] font-[800]"
              >Тақырып<input
                v-model="question.topic"
                class="mt-2 min-h-[48px] w-full rounded-[12px] border border-[#d7dee8] px-3 text-[14px]"
                minlength="2"
                maxlength="120"
                :disabled="savingQuestion"
                required
            /></label>
            <label class="block text-[12px] font-[800]"
              >Сұрақ мәтіні<textarea
                v-model="question.text"
                class="mt-2 min-h-24 w-full rounded-[12px] border border-[#d7dee8] p-3 text-[14px]"
                minlength="10"
                maxlength="1000"
                :disabled="savingQuestion"
                required
              />
            </label>
            <fieldset>
              <legend class="text-[12px] font-[800]">Жауап нұсқалары</legend>
              <div class="mt-2 space-y-2">
                <div
                  v-for="(option, index) in question.options"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="question.correctIndex"
                    type="radio"
                    name="correct-option"
                    :value="index"
                    :aria-label="`${index + 1}-нұсқа дұрыс`"
                    :disabled="savingQuestion"
                  />
                  <input
                    v-model="question.options[index]"
                    class="min-h-[46px] min-w-0 flex-1 rounded-[12px] border border-[#d7dee8] px-3 text-[14px]"
                    :aria-label="`${index + 1}-жауап нұсқасы`"
                    maxlength="300"
                    :disabled="savingQuestion"
                    required
                  />
                  <button
                    v-if="question.options.length > 2"
                    class="icon-button shrink-0 text-[#b4232a]"
                    type="button"
                    :disabled="savingQuestion"
                    :aria-label="`${index + 1}-нұсқаны өшіру`"
                    @click="removeOption(index)"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </div>
              <button
                v-if="question.options.length < 6"
                class="text-button mt-2 min-h-11"
                type="button"
                :disabled="savingQuestion"
                @click="addOption"
              >
                <Plus :size="17" /> Нұсқа қосу
              </button>
              <p class="mt-1 text-[11px] text-[#667085]">Дұрыс жауапты дөңгелек белгімен таңда.</p>
            </fieldset>
            <label class="block text-[12px] font-[800]"
              >Түсіндірме<textarea
                v-model="question.explanation"
                class="mt-2 min-h-24 w-full rounded-[12px] border border-[#d7dee8] p-3 text-[14px]"
                minlength="5"
                maxlength="2000"
                :disabled="savingQuestion"
                required
              />
            </label>
            <p v-if="questionError" class="text-[13px] text-[#b4232a]" role="alert">
              {{ questionError }}
            </p>
            <p
              v-if="questionSuccess"
              class="text-[13px] text-[#168b4c]"
              role="status"
              aria-live="polite"
            >
              {{ questionSuccess }}
            </p>
            <button
              class="primary-button min-h-[52px]"
              type="submit"
              :disabled="savingQuestion || !subjects.length"
            >
              {{ savingQuestion ? 'Сақталып жатыр…' : 'Сұрақты сақтау' }}
            </button>
          </form>
        </section>
      </template>
    </div>

    <BottomNav active="profile" />
  </section>
</template>
