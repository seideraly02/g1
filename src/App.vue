<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import { isWorkspaceRoute } from './components/navigation'

const route = useRoute()
const hasWorkspaceShell = computed(() => isWorkspaceRoute(route.name))
const hasFocusShell = computed(() => route.name === 'mock-exam')
</script>

<template>
  <main
    class="app-stage"
    :class="{
      'app-stage--workspace': hasWorkspaceShell,
      'app-stage--focus': hasFocusShell,
    }"
  >
    <AppSidebar v-if="hasWorkspaceShell" />
    <div class="app-route-stage">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="screen" mode="out-in">
          <component :is="Component" :key="currentRoute.fullPath" />
        </Transition>
      </RouterView>
    </div>
  </main>
</template>
