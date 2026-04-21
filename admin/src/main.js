import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAdminRouter } from './router'

const app = createApp(App)
const pinia = createPinia()
const router = createAdminRouter(pinia)

app.use(pinia)
app.use(router)
app.mount('#app')
