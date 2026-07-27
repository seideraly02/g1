<script setup lang="ts">
import { ArrowRight, Share2, Sparkles, TrendingUp } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import ProgressRing from '../components/ProgressRing.vue'

const router = useRouter()
const shareMessage = ref('')

async function shareResult() {
  const shareData = {
    title: 'Qadam ҰБТ',
    text: 'Тарих жаттығуында 20 сұрақтың 16-сына дұрыс жауап бердім!',
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
      shareMessage.value = 'Нәтиже бөлісілді'
      return
    }

    await navigator.clipboard?.writeText(shareData.text)
    shareMessage.value = 'Нәтиже көшірілді'
  } catch {
    shareMessage.value = ''
  }
}
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-white">
    <AppHeader title="Жаттығу аяқталды" close>
      <template #actions>
        <button class="icon-button" type="button" aria-label="Нәтижемен бөлісу" @click="shareResult">
          <Share2 :size="20" :stroke-width="2.2" />
        </button>
      </template>
    </AppHeader>

    <div class="flex flex-1 flex-col px-4 pb-5">
      <p v-if="shareMessage" class="mb-1 text-center text-[11px] font-[700] text-[#1aa65a]">
        {{ shareMessage }}
      </p>

      <div class="flex justify-center py-3">
        <ProgressRing :value="80" :size="140" :stroke="11" color="#8bc8ff">
          <div class="text-center">
            <div class="metric-value text-[34px] font-[850] leading-none tracking-[-.04em]">16/20</div>
            <div class="mt-2 text-[11px] text-[#536178]">дұрыс жауап</div>
          </div>
        </ProgressRing>
      </div>

      <div class="mt-1 grid grid-cols-3 gap-2">
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[21px] font-[850]">80%</div>
          <div class="mt-1 text-[10px] text-[#536178]">дәлдік</div>
        </div>
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[21px] font-[850]">11:24</div>
          <div class="mt-1 text-[10px] text-[#536178]">уақыт</div>
        </div>
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[21px] font-[850]">34 сек.</div>
          <div class="mt-1 text-[10px] text-[#536178]">әр сұраққа</div>
        </div>
      </div>

      <div class="mt-3 rounded-[18px] border border-[#b6f0ce] bg-[#f0fcf5] p-3">
        <div class="flex items-center gap-2">
          <TrendingUp :size="20" :stroke-width="2.3" />
          <span class="flex-1 text-[13px] font-[800]">Тарих бойынша ілгерілеу</span>
          <span class="rounded-lg bg-[#d9f8e6] px-2 py-1 text-[11px] font-[850] text-[#148649]">+6%</span>
        </div>
        <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-[#dfe7f1]">
          <div class="h-full w-[70%] rounded-full bg-gradient-to-r from-[#17a754] to-[#4ddc85]" />
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2">
        <div class="rounded-[18px] border border-[#b7f0cf] bg-[#f1fcf5] p-3">
          <span class="rounded-lg bg-[#dff8e9] px-2 py-1 text-[10px] font-[800] text-[#158a4a]">
            Күшті тақырып
          </span>
          <div class="mt-2 text-[13px] font-[800]">Қазақ хандығы</div>
          <div class="mt-1 text-[11px] text-[#536178]">5-тен 5</div>
        </div>
        <div class="rounded-[18px] border border-[#ffe07a] bg-[#fffbec] p-3">
          <span class="rounded-lg bg-[#fff1c9] px-2 py-1 text-[10px] font-[800] text-[#b65a09]">
            Қайталау
          </span>
          <div class="mt-2 text-[13px] font-[800]">XX ғасыр оқиғалары</div>
          <div class="mt-1 text-[11px] text-[#536178]">5-тен 2</div>
        </div>
      </div>

      <div class="mt-3 flex items-center gap-3 rounded-[18px] border border-[#b9dcff] bg-[#eff6ff] p-3">
        <Sparkles :size="23" :stroke-width="2" />
        <div class="min-w-0">
          <div class="text-[13px] font-[800]">Келесі қадам:</div>
          <div class="text-[12px] leading-5 text-[#536178]">4 қатені талдау — шамамен 5 минут.</div>
        </div>
      </div>

      <div class="mt-auto pt-5">
        <button class="primary-button" type="button" @click="router.push({ name: 'mistakes' })">
          Қателерді талдау
          <ArrowRight :size="18" />
        </button>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button class="text-button" type="button" @click="router.push({ name: 'training' })">
            Кейін қайталау
          </button>
          <button class="text-button" type="button" @click="router.push({ name: 'home' })">
            Басты бетке
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
