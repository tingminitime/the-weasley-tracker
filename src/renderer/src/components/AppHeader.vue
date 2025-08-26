<script setup lang="ts">
import UserMenu from './UserMenu.vue'
</script>

<template>
  <header
    class="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-lg"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center">
          <h1
            class="
              flex items-center gap-x-2 text-2xl font-extrabold text-gray-900
            "
          >
            <span
              class="i-material-symbols-alarm-on-rounded text-emerald-500"
            ></span>
            The Weasley Tracker
          </h1>
        </div>

        <div class="flex items-center space-x-4">
          <slot name="actions"></slot>
          <UserMenu />
        </div>
      </div>
    </div>
  </header>
</template>
