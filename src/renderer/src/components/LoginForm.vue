<script setup lang="ts">
import type { MockUser } from '@shared/types'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()

const selectedUserId = ref('')
const users = ref<MockUser[]>([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  try {
    await dataStore.initialize()
    users.value = dataStore.users

    if (authStore.isAuthenticated) {
      router.push('/dashboard')
    }
  }
  catch (err) {
    error.value = String(err)
  }
  finally {
    loading.value = false
  }
})

async function handleLogin() {
  if (!selectedUserId.value)
    return

  loading.value = true
  error.value = ''

  try {
    const result = await authStore.login(selectedUserId.value)
    if (result.success) {
      router.push('/dashboard')
    }
    else {
      error.value = result.error || '登入失敗'
    }
  }
  catch (err) {
    error.value = String(err)
  }
  finally {
    loading.value = false
  }
}

async function handleInitializeData() {
  loading.value = true
  error.value = ''

  try {
    await dataStore.resetData()
    await dataStore.initialize()
    users.value = dataStore.users
  }
  catch (err) {
    error.value = String(err)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="
      flex min-h-screen items-center justify-center bg-gradient-to-br
      from-blue-50 to-indigo-100
    "
  >
    <div class="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          🕐 The Weasley Tracker
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          查勤魔法 - 選擇用戶登入
        </p>
      </div>

      <div class="mt-8 space-y-6">
        <div
          v-if="error"
          class="rounded-md bg-red-50 p-4"
        >
          <div class="text-sm text-red-800">
            {{ error }}
          </div>
        </div>

        <div>
          <label
            for="user-select"
            class="block text-sm font-medium text-gray-700"
          >
            選擇用戶
          </label>
          <select
            id="user-select"
            v-model="selectedUserId"
            class="
              mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
              shadow-sm
              focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none
            "
            :disabled="loading"
          >
            <option value="">
              -- 請選擇用戶 --
            </option>
            <option
              v-for="user in users"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }} ({{ user.department }})
            </option>
          </select>
        </div>

        <div>
          <button
            :disabled="!selectedUserId || loading"
            class="
              group relative flex w-full justify-center rounded-md border
              border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium
              text-white
              hover:bg-indigo-700
              focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              focus:outline-none
              disabled:cursor-not-allowed disabled:opacity-50
            "
            @click="handleLogin"
          >
            <span
              v-if="loading"
              class="absolute inset-y-0 left-0 flex items-center pl-3"
            >
              <svg
                class="h-5 w-5 animate-spin text-indigo-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            {{ loading ? '登入中...' : '登入' }}
          </button>
        </div>

        <div class="text-center">
          <button
            :disabled="loading"
            class="
              text-sm text-indigo-600
              hover:text-indigo-500
              disabled:opacity-50
            "
            @click="handleInitializeData"
          >
            初始化測試資料
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
