<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <main class="app-stage">
    <RouterView v-slot="{ Component, route }">
      <Transition name="screen" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </main>
</template>
