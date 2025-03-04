import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'

Locale.use('en-US', enUS)

createApp(App).mount('#app')
