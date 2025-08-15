<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatusDisplay from '../components/StatusDisplay.vue'
import UserSwitcher from '../components/UserSwitcher.vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()

const loading = ref(false)

const usersWithStatus = computed(() => {
  return dataStore.getUsersWithStatus()
})

const currentUserData = computed(() => {
  if (!authStore.currentUser)
    return null

  const userData = usersWithStatus.value.find(
    data => data.user.id === authStore.currentUser?.id,
  )

  return userData || null
})

onMounted(async () => {
  // Initialize auth store
  await authStore.initialize()

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // Initialize data store
  await dataStore.initialize()
})

async function refreshData() {
  loading.value = true
  try {
    await dataStore.refreshData()
  }
  catch (error) {
    console.error('Failed to refresh data:', error)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header
      class="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">
              🕐 查勤魔法 (The Weasley Tracker)
            </h1>
          </div>

          <div class="flex items-center space-x-4">
            <button
              :disabled="loading"
              class="
                inline-flex items-center rounded-md border border-gray-300
                bg-white px-3 py-2 text-sm font-medium text-gray-700
                hover:bg-gray-50
                focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                focus:outline-none
                disabled:opacity-50
              "
              @click="refreshData"
            >
              <svg
                class="mr-2 h-4 w-4"
                :class="{ 'animate-spin': loading }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span class="font-semibold">{{ loading ? '更新中...' : '重新整理' }}</span>
            </button>

            <UserSwitcher />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div
        v-if="loading && !dataStore.isInitialized"
        class="py-12 text-center"
      >
        <div
          class="
            inline-block h-8 w-8 animate-spin rounded-full border-b-2
            border-indigo-600
          "
        ></div>
        <p class="mt-2 text-sm text-gray-500">
          載入中...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="dataStore.error"
        class="rounded-md bg-red-50 p-4"
      >
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              載入資料時發生錯誤
            </h3>
            <div class="mt-2 text-sm text-red-700">
              {{ dataStore.error }}
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-else>
        <!-- Current User Status -->
        <div class="mb-8">
          <h2 class="mb-4 text-lg font-medium text-gray-900">
            我的狀態
          </h2>
          <div
            v-if="currentUserData"
            class="max-w-md"
          >
            <StatusDisplay
              :user="currentUserData.user"
              :status="currentUserData.status"
              :attendance="currentUserData.attendance"
              :calendar="currentUserData.calendar"
            />
          </div>
          <div
            v-else
            class="text-gray-500"
          >
            無法載入用戶資料
          </div>
        </div>

        <!-- All Users Status -->
        <div>
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900">
              所有用戶狀態
            </h2>
            <div class="text-sm text-gray-500">
              共 {{ usersWithStatus.length }} 位用戶
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatusDisplay
              v-for="userData in usersWithStatus"
              :key="userData.user.id"
              :user="userData.user"
              :status="userData.status"
              :attendance="userData.attendance"
              :calendar="userData.calendar"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
