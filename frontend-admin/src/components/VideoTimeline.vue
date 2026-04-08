<template>
  <div class="video-timeline glow-border">
    <div class="video-timeline__title">
      <el-icon><Clock /></el-icon> 事件时间轴
      <div
        v-if="selectionStart !== null && selectionEnd !== null"
        class="video-timeline__selection-info"
      >
        <el-icon><DataLine /></el-icon>
        <span
          >选中区间: {{ formatTime(selectionStart) }} -
          {{ formatTime(selectionEnd) }}</span
        >
        <el-button size="small" text type="danger" @click="clearSelection"
          >清除</el-button
        >
      </div>
    </div>
    <div
      class="video-timeline__track"
      ref="trackRef"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <div class="video-timeline__line"></div>

      <div
        v-if="selectionStart !== null && selectionEnd !== null"
        class="video-timeline__selection"
        :style="{
          left: (Math.min(selectionStart, selectionEnd) / duration) * 100 + '%',
          width:
            (Math.abs(selectionEnd - selectionStart) / duration) * 100 + '%',
        }"
      ></div>

      <div
        v-if="selectionStart !== null && selectionEnd !== null"
        class="video-timeline__selection-labels"
      >
        <div
          class="video-timeline__selection-label video-timeline__selection-label--start"
          :style="{
            left:
              (Math.min(selectionStart, selectionEnd) / duration) * 100 + '%',
          }"
        >
          {{ formatTime(Math.min(selectionStart, selectionEnd)) }}
        </div>
        <div
          class="video-timeline__selection-label video-timeline__selection-label--end"
          :style="{
            left:
              (Math.max(selectionStart, selectionEnd) / duration) * 100 + '%',
          }"
        >
          {{ formatTime(Math.max(selectionStart, selectionEnd)) }}
        </div>
      </div>

      <div
        v-if="
          isSelecting &&
          tempSelectionStart !== null &&
          tempSelectionEnd !== null
        "
        class="video-timeline__selection video-timeline__selection--temp"
        :style="{
          left:
            (Math.min(tempSelectionStart, tempSelectionEnd) / duration) * 100 +
            '%',
          width:
            (Math.abs(tempSelectionEnd - tempSelectionStart) / duration) * 100 +
            '%',
        }"
      ></div>

      <div
        v-for="evt in events"
        :key="evt.time"
        class="video-timeline__event"
        :class="'is-' + evt.type"
        :style="{ left: (evt.time / duration) * 100 + '%' }"
        @click="onEventClick(evt.time, $event)"
      >
        <div class="video-timeline__dot">
          <div class="video-timeline__dot-inner"></div>
        </div>
        <div class="video-timeline__label">{{ evt.label }}</div>
      </div>
    </div>
    <div class="video-timeline__bar">
      <div
        class="video-timeline__bar-fill"
        :style="{ width: progress + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Clock, DataLine } from "@element-plus/icons-vue";

const props = defineProps({
  events: { type: Array, default: () => [] },
  duration: { type: Number, default: 180 },
  progress: { type: Number, default: 0 },
});

const emit = defineEmits(["jump", "selectionChange"]);

const trackRef = ref(null);
const isSelecting = ref(false);
const selectionStart = ref(null);
const selectionEnd = ref(null);
const tempSelectionStart = ref(null);
const tempSelectionEnd = ref(null);

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function getTimeFromEvent(event) {
  if (!trackRef.value) return 0;
  const rect = trackRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  return percentage * props.duration;
}

function onMouseDown(event) {
  if (event.button !== 0) return;
  isSelecting.value = true;
  const time = getTimeFromEvent(event);
  tempSelectionStart.value = time;
  tempSelectionEnd.value = time;
}

function onMouseMove(event) {
  if (!isSelecting.value) return;
  const time = getTimeFromEvent(event);
  tempSelectionEnd.value = time;
}

function onMouseUp(event) {
  if (!isSelecting.value) return;
  isSelecting.value = false;

  if (tempSelectionStart.value !== null && tempSelectionEnd.value !== null) {
    const start = Math.min(tempSelectionStart.value, tempSelectionEnd.value);
    const end = Math.max(tempSelectionStart.value, tempSelectionEnd.value);

    if (Math.abs(end - start) > 0.5) {
      selectionStart.value = start;
      selectionEnd.value = end;
      emit("selectionChange", { start, end });
    }
  }

  tempSelectionStart.value = null;
  tempSelectionEnd.value = null;
}

function onEventClick(time, event) {
  event.stopPropagation();
  emit("jump", time);
}

function clearSelection() {
  selectionStart.value = null;
  selectionEnd.value = null;
  emit("selectionChange", null);
}

defineExpose({ clearSelection, selectionStart, selectionEnd });
</script>

<style lang="scss" scoped>
.video-timeline {
  background: $color-bg-card;
  border-radius: $radius-lg;
  padding: $spacing-md $spacing-lg;

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 14px;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: $spacing-lg;
    .el-icon {
      color: $color-accent;
    }
  }

  &__selection-info {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-left: auto;
    font-size: 12px;
    color: $color-accent;
    background: rgba(0, 212, 255, 0.1);
    padding: 4px 12px;
    border-radius: $radius-md;
    border: 1px solid rgba(0, 212, 255, 0.2);
  }

  &__track {
    position: relative;
    height: 70px;
    margin: 0 20px $spacing-md;
    cursor: crosshair;
    user-select: none;
  }

  &__line {
    position: absolute;
    top: 9px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      rgba(0, 212, 255, 0.3),
      rgba(139, 92, 246, 0.3)
    );
    border-radius: 1px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: -3px;
      width: 8px;
      height: 8px;
      background: $color-accent;
      border-radius: 50%;
      box-shadow: 0 0 8px $color-accent;
    }

    &::after {
      content: "";
      position: absolute;
      right: 0;
      top: -3px;
      width: 8px;
      height: 8px;
      background: $color-purple;
      border-radius: 50%;
      box-shadow: 0 0 8px $color-purple;
    }
  }

  &__selection {
    position: absolute;
    top: 0;
    height: 100%;
    background: rgba(0, 212, 255, 0.15);
    border-left: 2px solid $color-accent;
    border-right: 2px solid $color-accent;
    pointer-events: none;

    &--temp {
      background: rgba(139, 92, 246, 0.1);
      border-color: $color-purple;
      border-style: dashed;
    }
  }

  &__selection-labels {
    position: absolute;
    top: -24px;
    left: 0;
    right: 0;
    pointer-events: none;
  }

  &__selection-label {
    position: absolute;
    transform: translateX(-50%);
    font-size: 11px;
    font-family: $font-family-mono;
    color: $color-text-primary;
    background: $color-accent;
    padding: 2px 8px;
    border-radius: $radius-xs;
    white-space: nowrap;

    &--start {
      &::after {
        content: "";
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid $color-accent;
      }
    }

    &--end {
      background: $color-purple;

      &::after {
        content: "";
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid $color-purple;
      }
    }
  }

  &__event {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    cursor: pointer;
    transition: all $transition-fast;
    z-index: 1;

    &:hover {
      transform: translateX(-50%) translateY(-2px);
      .video-timeline__dot {
        transform: scale(1.2);
      }
      .video-timeline__label {
        color: $color-text-primary;
      }
    }
  }

  &__dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px;
    transition: transform $transition-fast;

    .is-info & {
      background: rgba(0, 212, 255, 0.2);
      box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
    }
    .is-success & {
      background: rgba(34, 197, 94, 0.2);
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
    }
    .is-warning & {
      background: rgba(245, 158, 11, 0.2);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
    }
    .is-danger & {
      background: rgba(239, 68, 68, 0.2);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
    }
  }

  &__dot-inner {
    width: 10px;
    height: 10px;
    border-radius: 50%;

    .is-info & {
      background: $color-accent;
    }
    .is-success & {
      background: $color-success;
    }
    .is-warning & {
      background: $color-warning;
    }
    .is-danger & {
      background: $color-danger;
    }
  }

  &__label {
    font-size: 12px;
    color: $color-text-muted;
    white-space: nowrap;
    text-align: center;
    transition: color $transition-fast;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    background: linear-gradient(90deg, $color-accent, $color-purple);
    border-radius: 2px;
    transition: width 0.1s linear;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
  }
}

@media (max-width: 640px) {
  .video-timeline {
    padding: $spacing-md;

    &__track {
      display: flex;
      flex-direction: column;
      height: auto;
      margin: 0 0 $spacing-md;
      gap: 0;
      cursor: default;
    }

    &__line {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 9px;
      right: auto;
      width: 2px;
      height: 100%;

      &::before {
        top: 0;
        left: -3px;
      }

      &::after {
        top: auto;
        bottom: 0;
        right: auto;
        left: -3px;
      }
    }

    &__selection {
      display: none;
    }

    &__selection-labels {
      display: none;
    }

    &__event {
      position: relative;
      top: auto;
      left: auto !important;
      transform: none;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0 10px 0;

      &:hover {
        transform: none;
      }
    }

    &__dot {
      margin: 0;
      flex-shrink: 0;
    }

    &__label {
      max-width: none;
      text-align: left;
      font-size: 13px;
    }
  }
}
</style>
