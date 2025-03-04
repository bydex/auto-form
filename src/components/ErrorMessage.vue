<script lang="ts" setup>
defineProps({
  errorMessage: {
    type: String,
  },
  usePadding: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <slot></slot>
  <p v-if="errorMessage" class="error-message" :class="{ 'error-message_padding': usePadding }">
    {{ errorMessage }}
  </p>
</template>

<style scoped>
.error-message {
  color: var(--van-danger-color);
  font-size: var(--van-field-error-message-font-size);
  background: var(--van-cell-background);
  text-align: left;
}
.error-message_padding {
  padding: var(--van-cell-vertical-padding) var(--van-cell-horizontal-padding);
}
</style>
