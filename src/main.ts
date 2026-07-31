import { createApp } from 'vue'
import '@fontsource-variable/inter'
import App from './App.vue'
import { router } from './router'
import { pinia } from './stores/pinia'
import './styles.css'

createApp(App).use(pinia).use(router).mount('#app')
