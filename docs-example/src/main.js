import { createApp } from 'vue'
import { createStore } from 'vuex'
import { vnovaModule } from 'vnova-engine'
import App from './App.vue'

const store = createStore({
  modules: {
    vnova: vnovaModule
  }
})

createApp(App)
  .use(store)
  .mount('#app')
