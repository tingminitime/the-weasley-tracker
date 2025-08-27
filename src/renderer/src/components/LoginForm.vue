<script setup lang="ts">
import type { MockUser } from '@shared/types'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { computed, onMounted, ref } from 'vue'
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

const groupedUsers = computed(() => {
  return Object.groupBy(users.value, user => user.department)
})

onMounted(async () => {
  loading.value = true
  try {
    await dataStore.initialize()
    users.value = dataStore.users

    if (authStore.isAuthenticated) {
      router.push('/chat')
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
      router.push('/chat')
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
    class="flex min-h-screen items-center justify-center bg-gray-100"
  >
    <div class="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
      <div class="text-center">
        <h2
          class="
            mt-6 flex items-center justify-center gap-x-2 text-3xl
            font-extrabold text-gray-900
          "
        >
          <span
            class="i-material-symbols-alarm-on-rounded text-emerald-500"
          ></span>
          The Weasley Tracker
        </h2>
        <p class="mt-2 text-xl font-semibold tracking-widest text-emerald-600">
          查勤魔法
        </p>
      </div>

      <div class="space-y-6">
        <div
          v-if="error"
          class="rounded-md bg-red-50 p-4"
        >
          <div class="text-sm text-red-800">
            {{ error }}
          </div>
        </div>

        <div>
          <div class="text-center tracking-wide text-gray-700">
            選擇使用者登入
          </div>
          <Select
            v-model="selectedUserId"
            :disabled="loading"
          >
            <SelectTrigger class="mt-1 w-full">
              <SelectValue placeholder="-- 請選擇用戶 --" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup
                v-for="(departmentUsers, department) in groupedUsers"
                :key="department"
              >
                <SelectLabel class="font-semibold text-emerald-700">
                  {{ department }}
                </SelectLabel>
                <SelectItem
                  v-for="user in departmentUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} (&nbsp;{{ user.department }}&nbsp;)
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <button
            :disabled="!selectedUserId || loading"
            class="
              group relative flex w-full justify-center rounded-md border
              border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium
              text-white
              hover:bg-emerald-700
              focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
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
                class="h-5 w-5 animate-spin text-emerald-300"
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
            <span class="text-base font-bold tracking-widest">{{ loading ? '登入中...' : '登入' }}</span>
          </button>
        </div>

        <div class="text-center">
          <button
            :disabled="loading"
            class="
              text-sm text-emerald-600
              hover:text-emerald-500
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
