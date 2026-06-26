import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createMobileRouter } from './router'
import './styles/index.css'

const app = createApp(App)
const pinia = createPinia()
const router = createMobileRouter(pinia)

app.use(pinia)
app.use(router)
app.mount('#app')
