<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isOpen = ref(false)
const loading = ref(false)

const currentUser = computed(() => authStore.currentUser)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
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
          inline-flex w-full cursor-pointer items-center justify-center
          overflow-clip rounded-full text-sm font-medium text-gray-700 shadow-sm
          hover:bg-gray-50
          focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
          focus:outline-none
        "
        @click="toggleDropdown"
      >
        <div
          class="flex h-8 w-8 items-center justify-center bg-emerald-500"
        >
          <span class="text-sm font-medium text-white">
            {{ currentUser?.name?.charAt(0) || '?' }}
          </span>
        </div>
      </button>
    </div>

    <transition
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
    </transition>
  </div>
</template>
