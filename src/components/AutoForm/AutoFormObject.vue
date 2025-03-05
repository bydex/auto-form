<script setup lang="ts">
import { camelToFlat } from '@/utils/helpers/camel-to-flat'
import { autoFormInjectionKey } from '@/utils/helpers/keys'
import { computed, inject, provide, reactive, toRefs } from 'vue'

const modelValue = defineModel({
  type: Object,
  required: true,
})
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
  },
  required: {
    type: Boolean,
  },
})
const { id: fieldId, path } = toRefs(props)

const injected = inject(autoFormInjectionKey)

if (!injected.errors || !injected.fieldConfig || !injected.formSchema) {
  throw new Error('There is no required params')
}

const { errors, fieldConfig, formSchema } = injected

const fieldLabel = computed(() => {
  return (
    currentFieldConfig.value?.label ??
    currentSchemaProperty.value?.description ??
    camelToFlat(fieldId.value)
  )
})

const currentSchemaProperty = computed(() => formSchema.value.properties[fieldId.value])
const currentFieldConfig = computed(() => fieldConfig.value[fieldId.value])

const activeCollapses = reactive<Record<string, string | number>>({})

provide(autoFormInjectionKey, {
  errors,
  fieldConfig,
  formSchema: computed(() => formSchema.value?.properties?.[fieldId.value]),
})

const computePath = computed(() => {
  if (path.value) {
    if (!path.value.split('.').includes(fieldId.value)) {
      return `${fieldId.value}.${path.value}`
    } else {
      return path.value
    }
  }

  return fieldId.value
})
</script>

<template>
  <ErrorMessage :error-message="errorMessage">
    <van-collapse
      class="collapse"
      :model-value="activeCollapses[id] ?? []"
      @update:model-value="(value) => (activeCollapses[id] = value)"
    >
      <van-collapse-item :title="fieldLabel" name="1">
        <template #icon v-if="required"> <span class="required-star">*</span> </template>
        <template v-for="(_, key) in currentSchemaProperty.properties" :key="key">
          <slot
            :name="`${computePath}.${key}`"
            :model-value="modelValue[key]"
            @update:model-value="(value) => (modelValue[key] = value)"
            :id="key"
            :path="`${computePath}.${key}`"
          >
            <AutoFormField
              :key="key"
              :id="key"
              v-model="modelValue[key]"
              :path="`${computePath}.${key}`"
            >
              <template v-for="slot in Object.keys($slots)" v-slot:[slot]="slotProps">
                <slot :name="slot" v-bind="slotProps" />
              </template>
            </AutoFormField>
          </slot>
        </template>
      </van-collapse-item>
    </van-collapse>
  </ErrorMessage>
</template>

<style scoped>
.collapse {
  --van-collapse-item-content-padding: var(--van-padding-sm) 0 0 0;
}

.required-star {
  color: var(--van-danger-color);
  margin-right: 2px;
}
</style>
