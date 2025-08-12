<script setup lang="ts">
</script>

<template>
  <div
    class="
      flex min-h-screen items-center justify-center bg-gradient-to-br
      from-blue-500 to-purple-600
    "
  >
    <div class="mx-4 max-w-md rounded-xl bg-white p-8 shadow-2xl">
      <h1 class="mb-4 text-center text-3xl font-bold text-gray-800">
        Welcome to The Weasley Tracker ✨✨
      </h1>
      <p class="mb-6 text-center text-gray-600">
        A magical way to track your family adventures
      </p>
      <div class="space-y-4">
        <button
          class="
            w-full rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white
            shadow-md transition duration-200
            hover:bg-blue-600 hover:shadow-lg
          "
        >
          Start Tracking
        </button>
        <button
          class="
            w-full rounded-lg border border-gray-300 bg-gray-100 px-6 py-3
            font-semibold text-gray-700 transition duration-200
            hover:bg-gray-200
          "
        >
          View History
        </button>
      </div>
    </div>
  </div>
</template>
