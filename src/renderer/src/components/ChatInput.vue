<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  sendMessage: [message: string]
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const isComposing = ref(false)

function sendMessage() {
  const message = inputText.value.trim()
  if (message && !props.loading && !props.disabled) {
    emit('sendMessage', message)
    inputText.value = ''
    // Reset textarea height
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  }
}

function handleEnter(event: KeyboardEvent) {
  // Enter without Shift = send message
  // Shift + Enter = new line
  // Don't send message if IME is composing
  if (!event.shiftKey && !isComposing.value) {
    event.preventDefault()
    sendMessage()
  }
}

function adjustTextareaHeight() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 120)}px`
  }
}
</script>

<template>
  <div class="rounded-lg bg-white px-4 shadow-lg">
    <div class="flex items-center space-x-4">
      <!-- Input Area -->
      <div class="flex-1">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          placeholder="我想知道 ..."
          class="
            w-full resize-none rounded-md px-3 py-6 text-base transition-colors
            duration-200
            placeholder:tracking-wider
            focus:outline-none
          "
          rows="1"
          :disabled="disabled"
          @keydown.enter="handleEnter"
          @input="adjustTextareaHeight"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
        ></textarea>
      </div>

      <!-- Send Button -->
      <button
        :disabled="!inputText.trim() || loading || disabled"
        class="
          flex items-center rounded-md p-2 text-sm font-medium transition-colors
          duration-200
          focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          focus:outline-none
        "
        :class="{
          'cursor-pointer text-emerald-500 hover:bg-emerald-100': inputText.trim() && !loading && !disabled,
          'cursor-not-allowed text-gray-300': !inputText.trim() || loading || disabled,
        }"
        @click="sendMessage"
      >
        <!-- Loading Spinner -->
        <svg
          v-if="loading"
          class="mr-2 h-4 w-4 animate-spin"
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

        <!-- Send Icon -->
        <span
          v-else
          class="i-carbon-send-alt-filled size-8"
        ></span>
      </button>
    </div>

    <!-- Helper Text -->
    <div class="border-t border-gray-100 py-2 text-xs text-gray-500">
      <span>按 Enter 發送，Shift+Enter 換行</span>
    </div>
  </div>
</template>
