<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <AIBot />
  </div>
</template>

<script setup>
import AIBot from '@/components/AIBot.vue'
</script>

<style lang="scss">
.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: $color-bg-deep;
  overflow: hidden;
}
</style>
