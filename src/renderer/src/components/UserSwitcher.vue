<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()

const isOpen = ref(false)
const loading = ref(false)

const currentUser = computed(() => authStore.currentUser)

const otherUsers = computed(() => {
  if (!currentUser.value)
    return dataStore.users
  return dataStore.users.filter(user => user.id !== currentUser.value?.id)
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

async function switchToUser(userId: string) {
  loading.value = true
  closeDropdown()

  try {
    const result = await authStore.switchUser(userId)
    if (result.success) {
      // Refresh data for new user
      await dataStore.refreshData()
    }
    else {
      console.error('Failed to switch user:', result.error)
    }
  }
  catch (error) {
    console.error('Error switching user:', error)
  }
  finally {
    loading.value = false
  }
}

async function handleLogout() {
  loading.value = true
  closeDropdown()

  try {
    const result = await authStore.logout()
    if (result.success) {
      router.push('/login')
    }
    else {
      console.error('Failed to logout:', result.error)
    }
  }
  catch (error) {
    console.error('Error during logout:', error)
  }
  finally {
    loading.value = false
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as Element
  if (!target.closest('.relative.inline-block.text-left')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative inline-block text-left">
    <div>
      <button
        class="
          inline-flex w-full items-center justify-center rounded-md border
          border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700
          shadow-sm
          hover:bg-gray-50
          focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          focus:outline-none
        "
        @click="toggleDropdown"
      >
        <div class="flex items-center space-x-2">
          <div
            class="
              flex h-8 w-8 items-center justify-center rounded-full
              bg-indigo-500
            "
          >
            <span class="text-sm font-medium text-white">
              {{ currentUser?.name?.charAt(0) || '?' }}
            </span>
          </div>
          <span>{{ currentUser?.name || '未登入' }}</span>
        </div>
        <svg
          class="ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-show="isOpen"
        class="
          absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white
          shadow-lg ring-1 ring-black
          focus:outline-none
        "
      >
        <div class="py-1">
          <div class="border-b px-4 py-2 text-sm text-gray-500">
            切換用戶
          </div>

          <button
            v-for="user in otherUsers"
            :key="user.id"
            :disabled="loading"
            class="
              group flex w-full items-center px-4 py-2 text-sm text-gray-700
              hover:bg-gray-100 hover:text-gray-900
              disabled:cursor-not-allowed disabled:opacity-50
            "
            @click="switchToUser(user.id)"
          >
            <div
              class="
                mr-3 flex h-6 w-6 items-center justify-center rounded-full
                bg-gray-400
              "
            >
              <span class="text-xs font-medium text-white">
                {{ user.name.charAt(0) }}
              </span>
            </div>
            <div class="flex-1">
              <div class="font-medium">
                {{ user.name }}
              </div>
              <div class="text-xs text-gray-500">
                {{ user.department }}
              </div>
            </div>
          </button>

          <div class="border-t">
            <button
              :disabled="loading"
              class="
                group flex w-full items-center px-4 py-2 text-sm text-red-700
                hover:bg-red-50 hover:text-red-900
                disabled:cursor-not-allowed disabled:opacity-50
              "
              @click="handleLogout"
            >
              <svg
                class="mr-3 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              登出
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
