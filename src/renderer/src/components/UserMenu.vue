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
const customTagsLoading = ref(false)
const customTags = ref<string[]>([])
const currentTag = ref<string | undefined>()
const newTagInput = ref('')
const showNewTagInput = ref(false)
const editingTagIndex = ref<number | null>(null)
const editingTagValue = ref('')

const currentUser = computed(() => authStore.currentUser)

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    loadCustomTags()
  }
}

function closeDropdown() {
  isOpen.value = false
  showNewTagInput.value = false
  editingTagIndex.value = null
  newTagInput.value = ''
  editingTagValue.value = ''
}

async function loadCustomTags() {
  if (!currentUser.value)
    return

  customTagsLoading.value = true
  try {
    const tags = await dataStore.getUserCustomTags(currentUser.value.id)
    customTags.value = tags
    currentTag.value = currentUser.value.tag
  }
  catch (error) {
    console.error('Failed to load custom tags:', error)
  }
  finally {
    customTagsLoading.value = false
  }
}

async function selectTag(tag: string) {
  if (!currentUser.value || loading.value)
    return

  loading.value = true
  try {
    const result = await dataStore.updateUserTag(currentUser.value.id, tag)
    if (result.success) {
      currentTag.value = tag
      authStore.currentUser = { ...authStore.currentUser!, tag }
    }
    else {
      console.error('Failed to select tag:', result.error)
    }
  }
  catch (error) {
    console.error('Error selecting tag:', error)
  }
  finally {
    loading.value = false
  }
}

async function clearTag() {
  if (!currentUser.value || loading.value)
    return

  loading.value = true
  try {
    const result = await dataStore.updateUserTag(currentUser.value.id, '')
    if (result.success) {
      currentTag.value = undefined
      authStore.currentUser = { ...authStore.currentUser!, tag: undefined }
    }
    else {
      console.error('Failed to clear tag:', result.error)
    }
  }
  catch (error) {
    console.error('Error clearing tag:', error)
  }
  finally {
    loading.value = false
  }
}

async function addNewTag() {
  if (!currentUser.value || !newTagInput.value.trim())
    return

  loading.value = true
  try {
    const result = await dataStore.addUserCustomTag(currentUser.value.id, newTagInput.value.trim())
    if (result.success) {
      customTags.value.push(newTagInput.value.trim())
      newTagInput.value = ''
      showNewTagInput.value = false
    }
    else {
      console.error('Failed to add tag:', result.error)
    }
  }
  catch (error) {
    console.error('Error adding tag:', error)
  }
  finally {
    loading.value = false
  }
}

function startEditingTag(index: number) {
  editingTagIndex.value = index
  editingTagValue.value = customTags.value[index]
}

async function saveEditingTag() {
  if (!currentUser.value || editingTagIndex.value === null || !editingTagValue.value.trim())
    return

  const oldTag = customTags.value[editingTagIndex.value]
  loading.value = true
  try {
    const result = await dataStore.updateUserCustomTag(currentUser.value.id, oldTag, editingTagValue.value.trim())
    if (result.success) {
      customTags.value[editingTagIndex.value] = editingTagValue.value.trim()
      // Update current tag if it was the edited tag
      if (currentTag.value === oldTag) {
        currentTag.value = editingTagValue.value.trim()
        authStore.currentUser = { ...authStore.currentUser!, tag: editingTagValue.value.trim() }
      }
      editingTagIndex.value = null
      editingTagValue.value = ''
    }
    else {
      console.error('Failed to update tag:', result.error)
    }
  }
  catch (error) {
    console.error('Error updating tag:', error)
  }
  finally {
    loading.value = false
  }
}

function cancelEditingTag() {
  editingTagIndex.value = null
  editingTagValue.value = ''
}

async function deleteTag(index: number) {
  if (!currentUser.value || loading.value)
    return

  const tagToDelete = customTags.value[index]
  loading.value = true
  try {
    const result = await dataStore.deleteUserCustomTag(currentUser.value.id, tagToDelete)
    if (result.success) {
      customTags.value.splice(index, 1)
      // Clear current tag if it was the deleted tag
      if (currentTag.value === tagToDelete) {
        currentTag.value = undefined
        authStore.currentUser = { ...authStore.currentUser!, tag: undefined }
      }
    }
    else {
      console.error('Failed to delete tag:', result.error)
    }
  }
  catch (error) {
    console.error('Error deleting tag:', error)
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
          absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white
          shadow-lg ring-1 ring-black
          focus:outline-none
        "
      >
        <div class="py-1">
          <!-- Current tag display -->
          <div class="border-b border-gray-100 px-4 py-2">
            <div class="mb-2 flex items-center justify-between">
              <div class="text-sm font-medium tracking-wide text-gray-500">
                目前狀態標籤
              </div>
              <button
                v-if="currentTag"
                :disabled="loading"
                class="
                  inline-flex cursor-pointer items-center gap-x-1 rounded border
                  border-red-600 px-1 py-0.5 text-xs text-red-700
                  hover:bg-red-50
                  disabled:opacity-50
                "
                @click.stop="clearTag"
              >
                清除
              </button>
            </div>
            <div
              v-if="currentTag"
              class="
                inline-flex items-center bg-gray-200 px-2 py-1 text-xs
                font-medium text-gray-900
              "
            >
              {{ currentTag }}
            </div>
            <div
              v-else
              class="text-xs text-gray-400 italic"
            >
              未設定
            </div>
          </div>

          <!-- Custom tags management -->
          <div class="px-4 py-2">
            <div class="mb-2 flex items-center justify-between">
              <div class="text-sm font-medium tracking-wide text-gray-500">
                自定義標籤
              </div>
              <button
                v-if="!showNewTagInput"
                :disabled="loading"
                class="
                  inline-flex cursor-pointer items-center gap-x-1 rounded border
                  border-blue-600 px-1 py-0.5 text-xs text-blue-700
                  hover:bg-blue-50
                  disabled:opacity-50
                "
                @click.stop="showNewTagInput = true"
              >
                <span class="i-carbon-add-alt"></span>
                新增
              </button>
            </div>

            <!-- New tag input -->
            <div
              v-if="showNewTagInput"
              class="mb-2"
            >
              <div class="flex gap-1">
                <input
                  v-model="newTagInput"
                  type="text"
                  placeholder="輸入標籤名稱"
                  class="
                    flex-1 rounded border border-gray-300 px-2 py-1 text-sm
                    outline-none
                    focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                  "
                  @keydown.enter="addNewTag"
                  @keydown.escape="showNewTagInput = false; newTagInput = ''"
                >
                <button
                  :disabled="loading || !newTagInput.trim()"
                  class="
                    cursor-pointer text-xl text-green-600
                    disabled:cursor-not-allowed disabled:text-gray-400
                    disabled:opacity-50
                  "
                  @click.stop="addNewTag"
                >
                  <span class="i-carbon-checkmark-filled"></span>
                  <span class="sr-only">確定</span>
                </button>
                <button
                  :disabled="loading"
                  class="
                    cursor-pointer text-xl text-red-600
                    disabled:cursor-not-allowed disabled:text-gray-400
                    disabled:opacity-50
                  "
                  @click.stop="showNewTagInput = false; newTagInput = ''"
                >
                  <span class="i-carbon-close-filled"></span>
                  <span class="sr-only">取消</span>
                </button>
              </div>
            </div>

            <!-- Custom tags list -->
            <div
              v-if="customTagsLoading"
              class="py-2 text-xs text-gray-500"
            >
              載入中...
            </div>
            <div
              v-else-if="customTags.length === 0"
              class="py-2 text-xs text-gray-400 italic"
            >
              尚無自定義標籤
            </div>
            <div
              v-else
              class="max-h-32 space-y-1 overflow-y-auto"
            >
              <div
                v-for="(tag, index) in customTags"
                :key="tag"
                class="flex items-center gap-1"
              >
                <!-- Radio button for selection -->
                <input
                  :id="`tag-${index}`"
                  type="radio"
                  :value="tag"
                  :checked="currentTag === tag"
                  :disabled="loading"
                  class="
                    h-3 w-3 border-gray-300 text-blue-600
                    focus:ring-1 focus:ring-blue-500
                  "
                  @change.stop="selectTag(tag)"
                >

                <!-- Tag label or edit input -->
                <div
                  v-if="editingTagIndex === index"
                  class="flex flex-1 gap-1"
                >
                  <input
                    v-model="editingTagValue"
                    type="text"
                    class="
                      flex-1 rounded border border-gray-300 px-1 py-0.5 text-sm
                      outline-none
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                    "
                    @keydown.enter="saveEditingTag"
                    @keydown.escape="cancelEditingTag"
                  >
                  <button
                    :disabled="loading || !editingTagValue.trim()"
                    class="
                      cursor-pointer text-xl text-green-600
                      hover:text-green-800
                      disabled:opacity-50
                    "
                    @click.stop="saveEditingTag"
                  >
                    <span class="i-carbon-checkmark-filled"></span>
                    <span class="sr-only">確定</span>
                  </button>
                  <button
                    :disabled="loading"
                    class="
                      cursor-pointer text-xl text-red-600
                      hover:text-red-800
                      disabled:opacity-50
                    "
                    @click.stop="cancelEditingTag"
                  >
                    <span class="i-carbon-close-filled"></span>
                    <span class="sr-only">取消</span>
                  </button>
                </div>
                <label
                  v-else
                  :for="`tag-${index}`"
                  class="flex-1 cursor-pointer truncate text-sm text-gray-900"
                >
                  {{ tag }}
                </label>

                <!-- Action buttons -->
                <div
                  v-if="editingTagIndex !== index"
                  class="flex gap-0.5"
                >
                  <button
                    :disabled="loading"
                    class="
                      cursor-pointer text-xl text-gray-400
                      hover:text-gray-600
                      disabled:opacity-50
                    "
                    @click.stop="startEditingTag(index)"
                  >
                    <span class="i-material-symbols-edit-square-outline-rounded"></span>
                    <span class="sr-only">編輯</span>
                  </button>
                  <button
                    :disabled="loading"
                    class="
                      cursor-pointer text-xl text-red-400
                      hover:text-red-600
                      disabled:opacity-50
                    "
                    @click.stop="deleteTag(index)"
                  >
                    <span class="i-material-symbols-delete-outline-rounded"></span>
                    <span class="sr-only">刪除</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings and Logout buttons -->
          <div class="border-t border-gray-100">
            <button
              :disabled="loading"
              class="
                group flex w-full cursor-pointer items-center px-4 py-2 text-sm
                text-gray-700
                hover:bg-gray-50 hover:text-gray-900
                disabled:cursor-not-allowed disabled:opacity-50
              "
              @click="router.push('/settings'); closeDropdown()"
            >
              <span class="mr-3 i-fluent-settings-20-regular h-5 w-5"></span>
              設定
            </button>
            <button
              :disabled="loading"
              class="
                group flex w-full cursor-pointer items-center px-4 py-2 text-sm
                text-red-700
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
    </transition>
  </div>
</template>
