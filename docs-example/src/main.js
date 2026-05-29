import { createVNovaApp } from 'vnova-engine'
import App from './App.vue'
import '../../src/vnova.css'

createVNovaApp(App)
  .mount('#app')
