<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <main class="app-stage">
    <div class="phone-frame">
      <RouterView v-slot="{ Component, route }">
        <Transition name="screen" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </div>
  </main>
</template>
