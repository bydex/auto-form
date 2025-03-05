<script setup lang="ts">
import { camelToFlat } from '@/utils/helpers/camel-to-flat'
import { autoFormInjectionKey } from '@/utils/helpers/keys'
import { computed, inject, provide, reactive, toRefs } from 'vue'
import { getDefaultPropertiesState } from './helpers'

const modelValue = defineModel({
  type: Array,
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
  formSchema: computed(() => currentSchemaProperty.value?.items),
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

const addMore = () => {
  modelValue.value.push(getDefaultPropertiesState(currentSchemaProperty.value.items.properties))
}

const remove = (index: number) => {
  modelValue.value.splice(index, 1)
}
</script>

<template>
  <ErrorMessage :error-message="errorMessage" use-padding>
    <van-collapse
      class="collapse"
      :model-value="activeCollapses[id] ?? []"
      @update:model-value="(value) => (activeCollapses[id] = value)"
    >
      <van-collapse-item :title="fieldLabel" name="1">
        <template #icon v-if="required"> <span class="required-star">*</span> </template>
        <div v-for="(_, index) in modelValue" :key="index" class="array-item">
          <template v-for="(_, key) in currentSchemaProperty.items.properties">
            <slot
              :name="`${computePath}.${key}`"
              :model-value="modelValue[index][key]"
              @update:model-value="(value) => (modelValue[index][key] = value)"
              :id="key"
              :path="`${computePath}.${index}.${key}`"
            >
              <AutoFormField
                :key="key"
                :id="key"
                v-model="modelValue[index][key]"
                :path="`${computePath}.${index}.${key}`"
              >
                <template v-for="slot in Object.keys($slots)" v-slot:[slot]="slotProps">
                  <slot :name="slot" v-bind="slotProps" />
                </template>
              </AutoFormField>
            </slot>
          </template>
          <van-button @click="remove(index)" icon="delete-o" type="danger">Remove</van-button>
        </div>

        <van-button @click="addMore" type="primary" icon="plus">Add more</van-button>
      </van-collapse-item>
    </van-collapse>
  </ErrorMessage>
</template>

<style scoped>
.collapse {
  --van-collapse-item-content-padding: var(--van-padding-sm) 0 0 0;
}

.array-item {
  position: relative;

  &:before {
    content: '';
    position: absolute;
    z-index: 1;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: var(--van-white);
    border-radius: 0 10px 10px 0;
    opacity: 0.5;
  }

  &:not(:last-child) {
    margin-bottom: 8px;
  }
}

.required-star {
  color: var(--van-danger-color);
  margin-right: 2px;
}
</style>
