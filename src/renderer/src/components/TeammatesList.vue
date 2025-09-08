<script setup lang="ts">
import { useAuthStore } from '@renderer/stores/auth'
import { useDataStore } from '@renderer/stores/data'
import { statusConfig } from '@renderer/utils/statusConfig'
import { useEventListener, useThrottleFn } from '@vueuse/core'
import { computed, nextTick, onMounted, ref } from 'vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

const scrollContainer = ref<HTMLElement>()
const canScrollUp = ref(false)
const canScrollDown = ref(false)
const isScrolling = ref(false)

let scrollTimeout: NodeJS.Timeout | null = null

const teammates = computed(() => {
  const currentUserId = authStore.currentUser?.id
  return dataStore.getUsersWithStatus()
    .filter(({ user }) => user.id !== currentUserId)
    .map(({ user, status }) => ({
      user,
      statusConfig: statusConfig[status?.currentStatus || 'off_duty'],
      isInactive: status?.currentStatus === 'on_leave' || status?.currentStatus === 'off_duty',
      customTag: user.tag,
    }))
})

function updateScrollState() {
  if (!scrollContainer.value)
    return

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  canScrollUp.value = scrollTop > 0
  canScrollDown.value = scrollTop < (scrollHeight - clientHeight) || scrollTop === 0
}

function handleScrollStart() {
  isScrolling.value = true

  // Clear existing timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  // Set new timeout to hide scrollbar after scrolling stops
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false
  }, 1000)
}

const throttledUpdateScrollState = useThrottleFn(() => {
  updateScrollState()
  handleScrollStart()
}, 100, true)

useEventListener(scrollContainer, 'scroll', throttledUpdateScrollState)

function handleRefresh() {
  dataStore.refreshData()
}

onMounted(() => {
  nextTick(updateScrollState)
})
</script>

<template>
  <div class="w-80 flex-shrink-0">
    <!-- 重新整理按鈕 -->
    <div class="mb-3 flex items-center gap-x-2 px-4">
      <div class="text-sm font-bold tracking-widest text-gray-700">
        同仁列表
      </div>
      <button
        :disabled="dataStore.loading"
        class="
          flex items-center space-x-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm
          font-medium text-gray-700 transition-colors
          hover:bg-gray-200
          disabled:cursor-not-allowed disabled:opacity-50
        "
        title="重新整理同仁狀態"
        @click="handleRefresh"
      >
        <span
          class="i-carbon-rotate-360 text-base"
          :class="{ 'animate-spin': dataStore.loading }"
        ></span>
        <span>重新整理</span>
      </button>
    </div>

    <div class="relative">
      <!-- 滾動容器 -->
      <div
        ref="scrollContainer"
        class="relative max-h-96 overflow-y-auto"
        :class="{ 'scrollbar-hidden': !isScrolling }"
      >
        <div class="space-y-2 px-1">
          <button
            v-for="{ user, statusConfig: userStatusConfig, isInactive, customTag } in teammates"
            :key="user.id"
            class="
              flex w-full cursor-pointer items-center space-x-2 rounded-lg px-3
              py-2 transition duration-150
              hover:bg-gray-200
            "
            :class="{ 'opacity-50': isInactive }"
          >
            <!-- Avatar -->
            <div
              class="
                flex h-6 w-6 shrink-0 items-center justify-center rounded-full
                text-xs font-semibold text-white select-none
              "
              :class="userStatusConfig.avatarClass"
            >
              {{ user.name.charAt(0) }}
            </div>

            <!-- Name -->
            <div
              class="
                w-[7ch] truncate text-left text-sm font-medium text-gray-700
              "
            >
              {{ user.name }}
            </div>

            <!-- Status Badge -->
            <span
              class="
                inline-flex shrink-0 items-center rounded-full px-2 py-0.5
                text-sm font-medium select-none
              "
              :class="userStatusConfig.class"
            >
              <span
                class="mr-1 h-1.5 w-1.5 rounded-full"
                :class="userStatusConfig.dotClass"
              ></span>
              {{ userStatusConfig.text }}
            </span>

            <!-- Custom Tag -->
            <span
              v-if="customTag"
              class="
                custom-tag inline-flex shrink-0 items-center bg-gray-200 py-0.5
                pr-2 pl-3 text-sm font-medium text-gray-900 select-none
              "
              :title="customTag"
            >
              {{ customTag.length > 8 ? `${customTag.slice(0, 8)}...` : customTag }}
            </span>
          </button>

          <div
            v-if="teammates.length === 0"
            class="
              rounded-lg bg-black/10 px-3 py-4 text-center text-sm text-white
              backdrop-blur-sm
            "
          >
            暫無其他同仁
          </div>
        </div>
      </div>

      <!-- 頂部模糊遮罩 -->
      <div
        class="
          pointer-events-none absolute top-0 z-50 h-10 w-full bg-gradient-to-b
          from-gray-50 to-transparent transition-opacity duration-300
          ease-in-out
        "
        :class="{ 'opacity-0': !canScrollUp, 'opacity-100': canScrollUp }"
      ></div>

      <!-- 底部模糊遮罩 -->
      <div
        class="
          pointer-events-none absolute bottom-0 z-50 h-10 w-full
          bg-gradient-to-t from-gray-50 to-transparent transition-opacity
          duration-300 ease-in-out
        "
        :class="{ 'opacity-0': !canScrollDown, 'opacity-100': canScrollDown }"
      ></div>

      <!-- 向下滾動提示 -->
      <div
        class="
          absolute -bottom-10 left-1/2 z-50 w-24 -translate-x-1/2 rounded-full
          bg-white/80 px-2 py-1 text-center text-xs text-gray-500 shadow-sm
          backdrop-blur-sm transition-opacity duration-300 ease-in-out
          select-none
        "
        :class="{ 'opacity-0': !canScrollDown, 'opacity-100': canScrollDown }"
      >
        向下查看更多
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dynamic scrollbar visibility */
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}

.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Visible scrollbar styling */
:not(.scrollbar-hidden)::-webkit-scrollbar {
  width: 6px;
}

:not(.scrollbar-hidden)::-webkit-scrollbar-track {
  background-color: #f3f4f6;
  border-radius: 3px;
}

:not(.scrollbar-hidden)::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

:not(.scrollbar-hidden)::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

/* Custom tag with triangle */
.custom-tag {
  position: relative;
  clip-path: polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 50%);
}
</style>
