import type { StatusType } from '@shared/types'

export interface StatusConfigItem {
  text: string
  class: string
  dotClass: string
  avatarClass: string
}

export const statusConfig: Record<StatusType, StatusConfigItem> = {
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
