<script setup lang="ts">
import type { MockUser, UserStatus } from '@shared/types'
import { computed } from 'vue'
import { statusConfig } from '../utils/statusConfig'

interface Props {
  user: MockUser
  status?: UserStatus
}

const props = defineProps<Props>()

const currentStatus = computed(() => {
  return props.status?.currentStatus || 'off_duty'
})

const statusText = computed(() => {
  return statusConfig[currentStatus.value]?.text || '未知'
})

const statusClass = computed(() => {
  return statusConfig[currentStatus.value]?.class || 'bg-gray-100 text-gray-800'
})

const statusDotClass = computed(() => {
  return statusConfig[currentStatus.value]?.dotClass || 'bg-gray-400'
})

const avatarClass = computed(() => {
  return statusConfig[currentStatus.value]?.avatarClass || 'bg-gray-500'
})

const statusDetail = computed(() => {
  return props.status?.statusDetail
})

const lastUpdated = computed(() => {
  return props.status?.lastUpdated
})

function formatTime(time: string | Date): string {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full"
          :class="avatarClass"
        >
          <span class="font-semibold text-white">
            {{ user.name.charAt(0) }}
          </span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ user.name }}
          </h3>
          <p class="text-gray-500">
            {{ user.department }}
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <span
          class="
            inline-flex items-center rounded-full px-2.5 py-0.5 text-sm
            font-medium tracking-wider
          "
          :class="statusClass"
        >
          <span
            class="mr-1.5 h-2 w-2 rounded-full"
            :class="statusDotClass"
          ></span>
          {{ statusText }}
        </span>
      </div>
    </div>

    <div
      v-if="user.tag"
      class="mt-3 w-max bg-gray-200 px-2 py-1 text-sm text-gray-900"
    >
      {{ user.tag }}
    </div>

    <div
      v-if="statusDetail"
      class="mt-3 text-sm text-gray-600"
    >
      {{ statusDetail }}
    </div>

    <div class="mt-3 text-sm text-gray-400">
      <div v-if="lastUpdated">
        最後更新：{{ formatTime(lastUpdated) }}
      </div>
      <div class="text-gray-700">
        工作時間：{{ user.workSchedule.startTime }} - {{ user.workSchedule.endTime }}
      </div>
    </div>
  </div>
</template>
