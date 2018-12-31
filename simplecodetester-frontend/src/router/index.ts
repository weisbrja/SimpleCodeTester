import Router from 'vue-router'
import Vue from 'vue'
import Login from '@/components/Login.vue'
import Profile from '@/components/Profile.vue'
import CheckCode from '@/components/CheckCode.vue'
import ViewCheckResult from '@/components/ViewCheckResult.vue'

let router = new Router({
  routes: [
    {
      path: '/',
      redirect: '/profile'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        title: function () {
          return 'Login'
        }
      }
    },
    {
      path: '/profile',
      name: 'Profil',
      component: Profile,
      meta: {
        title: function () {
          return 'Profile'
        }
      }
    },
    {
      path: '/check-code',
      name: 'Check Code',
      component: CheckCode,
      meta: {
        title: function () {
          return 'CheckCode'
        }
      }
    },
    {
      path: '/view-check-result',
      name: 'View check result',
      component: ViewCheckResult,
      meta: {
        title: function () {
          return 'View check result'
        }
      }
    }
  ]
})

router.afterEach((to, from) => {
  if (to && to.meta && to.meta.title) {
    Vue.nextTick(() => {
      document.title = to.meta.title(to)
    })
  }
})

export default router