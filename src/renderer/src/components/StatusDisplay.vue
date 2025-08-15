<script setup lang="ts">
import type { AttendanceRecord, CalendarEvent, MockUser, UserStatus } from '@shared/types'
import { computed } from 'vue'

interface Props {
  user: MockUser
  status?: UserStatus
  attendance?: AttendanceRecord[]
  calendar?: CalendarEvent[]
}

const props = defineProps<Props>()

const statusConfig = {
  on_duty: {
    text: '上班中',
    class: 'bg-green-100 text-green-800',
    dotClass: 'bg-green-400',
    avatarClass: 'bg-green-500',
  },
  off_duty: {
    text: '下班',
    class: 'bg-gray-100 text-gray-800',
    dotClass: 'bg-gray-400',
    avatarClass: 'bg-gray-500',
  },
  on_leave: {
    text: '請假',
    class: 'bg-yellow-100 text-yellow-800',
    dotClass: 'bg-yellow-400',
    avatarClass: 'bg-yellow-500',
  },
  wfh: {
    text: '遠端上班',
    class: 'bg-blue-100 text-blue-800',
    dotClass: 'bg-blue-400',
    avatarClass: 'bg-blue-500',
  },
  out: {
    text: '外出',
    class: 'bg-purple-100 text-purple-800',
    dotClass: 'bg-purple-400',
    avatarClass: 'bg-purple-500',
  },
  meeting: {
    text: '會議中',
    class: 'bg-red-100 text-red-800',
    dotClass: 'bg-red-400',
    avatarClass: 'bg-red-500',
  },
}

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

const isExpired = computed(() => {
  if (!props.status?.expiresAt)
    return false
  return new Date() > new Date(props.status.expiresAt)
})

const attendanceToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return props.attendance?.filter(record => record.date === today) || []
})

const attendanceText = computed(() => {
  const todayRecord = attendanceToday.value[0]
  if (!todayRecord)
    return '未打卡'

  if (todayRecord.checkIn && todayRecord.checkOut) {
    return `${formatTime(todayRecord.checkIn)} - ${formatTime(todayRecord.checkOut)}`
  }
  else if (todayRecord.checkIn) {
    return `${formatTime(todayRecord.checkIn)} 進入`
  }
  else {
    return '未打卡'
  }
})

const attendanceClass = computed(() => {
  const todayRecord = attendanceToday.value[0]
  if (!todayRecord?.checkIn)
    return 'text-gray-500'
  if (todayRecord.checkOut)
    return 'text-green-600'
  return 'text-blue-600'
})

const upcomingMeetings = computed(() => {
  const now = new Date()
  return props.calendar?.filter(event =>
    event.status === 'scheduled' && new Date(event.startTime) > now,
  ) || []
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
            inline-flex items-center rounded-full px-2.5 py-0.5 text-xs
            font-medium
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
      v-if="status?.statusDetail"
      class="mt-3 text-sm text-gray-600"
    >
      {{ status.statusDetail }}
    </div>

    <div class="mt-3 text-sm text-gray-400">
      <div v-if="status?.lastUpdated">
        最後更新：{{ formatTime(status.lastUpdated) }}
      </div>
      <div v-if="status?.expiresAt && !isExpired">
        到期時間：{{ formatTime(status.expiresAt) }}
      </div>
      <div
        v-if="isExpired"
        class="text-red-500"
      >
        狀態已過期
      </div>
    </div>

    <div class="mt-3 text-sm">
      <div class="text-gray-700">
        工作時間：{{ user.workSchedule.startTime }} - {{ user.workSchedule.endTime }}
      </div>

      <div
        v-if="attendanceToday.length > 0"
        class="mt-1"
      >
        <span class="text-gray-700">今日出勤：</span>
        <span
          class="ml-1"
          :class="attendanceClass"
        >{{ attendanceText }}</span>
      </div>

      <div
        v-if="upcomingMeetings.length > 0"
        class="mt-1"
      >
        <span class="text-gray-500">會議:</span>
        <span class="ml-1 text-blue-600">{{ upcomingMeetings.length }} 個會議</span>
      </div>
    </div>
  </div>
</template>
