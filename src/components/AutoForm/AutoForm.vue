<script setup>
import { computed, provide, readonly, ref, toRefs, watch } from 'vue'
import zodToJsonSchema from 'zod-to-json-schema'
import AutoFormField from '@/components/AutoForm/AutoFormField.vue'
import { autoFormInjectionKey } from '@/utils/helpers/keys'
import { getDefaultPropertiesState } from './helpers'

const props = defineProps({
  zodSchema: {
    type: Object,
    required: true,
  },
  fieldConfig: {
    type: Object,
    default: () => {},
  },
})
const { zodSchema, fieldConfig } = toRefs(props)

const formSchema = computed(() => {
  return zodToJsonSchema(zodSchema.value, 'formSchema')
})

const formState = ref({})

watch(
  formSchema,
  () => {
    formState.value = getDefaultPropertiesState(formSchema.value.definitions.formSchema.properties)
  },
  {
    immediate: true,
  },
)

const errors = computed(() => {
  if (!isTouched.value) return []

  const result = zodSchema.value.safeParse(formState.value)

  if (result.success) return []
  else return result.error.errors
})

const isTouched = ref(false)

const submit = () => {
  isTouched.value = true
}

provide(autoFormInjectionKey, {
  errors: errors,
  fieldConfig: readonly(fieldConfig),
  formSchema: computed(() => formSchema.value?.definitions?.formSchema),
})
</script>

<template>
  <pre>
    {{ formState }}
  </pre>
  <van-form
    v-if="
      formSchema.definitions?.formSchema?.type === 'object' &&
      formSchema.definitions?.formSchema?.properties
    "
    class="form"
  >
    <template v-for="(_, key) in formSchema.definitions.formSchema.properties" :key="key">
      <slot
        :name="key"
        :model-value="formState[key]"
        @update:model-value="(value) => (formState[key] = value)"
        :id="key"
      >
        <AutoFormField :key="key" :id="key" v-model="formState[key]">
          <template v-for="slot in Object.keys($slots)" v-slot:[slot]="slotProps">
            <slot :name="slot" v-bind="slotProps" />
          </template>
        </AutoFormField>
      </slot>
    </template>

    <van-button @click="submit" type="primary" block>Submit</van-button>
  </van-form>
</template>

<style scoped>
.form {
  background: var(--van-cell-background);
}
</style>
