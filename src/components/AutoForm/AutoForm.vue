<script setup>
import { computed, provide, readonly, ref, toRefs, watch } from 'vue'
import zodToJsonSchema from 'zod-to-json-schema'
import AutoFormField from '@/components/AutoForm/AutoFormField.vue'
import { autoFormInjectionKey } from '@/utils/helpers/keys'
import { getDefaultPropertiesState } from './helpers'
import { deepFind } from '@/utils/helpers/deep-find'
import { DependencyType } from './constants'
import z from 'zod'

const props = defineProps({
  zodSchema: {
    type: Object,
    required: true,
  },
  fieldConfig: {
    type: Object,
    default: () => {},
  },
  dependencies: {
    type: Array,
    default: () => [],
  },
})
const { zodSchema, fieldConfig, dependencies } = toRefs(props)

const computeDependencies = computed(() => {
  return dependencies.value.map((dependency) => {
    return {
      sourceValue: deepFind(formState.value, dependency.sourceField),
      targetValue: deepFind(formState.value, dependency.targetField),
      ...dependency,
    }
  })
})

const fieldsToHide = computed(() => {
  const obj = {}

  computeDependencies.value
    .filter((dependency) => {
      if (dependency.type === DependencyType.HIDES) {
        return dependency.when(dependency.sourceValue, dependency.targetValue)
      }

      return false
    })
    .forEach((dep) => {
      obj[dep.targetField] = true
    })

  return obj
})
const fieldsToRequire = computed(() => {
  const obj = {}

  computeDependencies.value
    .filter((dependency) => {
      if (dependency.type === DependencyType.REQUIRES) {
        return dependency.when(dependency.sourceValue, dependency.targetValue)
      }

      return false
    })
    .forEach((dep) => {
      obj[dep.targetField] = true
    })

  return obj
})
const fieldsToSetOptions = computed(() => {
  const obj = {}

  computeDependencies.value
    .filter((dependency) => {
      if (dependency.type === DependencyType.SETS_OPTIONS) {
        return dependency.when(dependency.sourceValue, dependency.targetValue)
      }

      return false
    })
    .forEach((dependency) => {
      obj[dep.targetField] = z.enum(dependency.options)
    })

  return obj
})

const modifiedZodSchema = computed(() => {
  return zodSchema.value
    .omit(fieldsToHide.value)
    .required(fieldsToRequire.value)
    .extend(fieldsToSetOptions.value)
})

const formSchema = computed(() => {
  return zodToJsonSchema(modifiedZodSchema.value, 'formSchema')
})

const formState = ref({})

watch(
  formSchema,
  () => {
    formState.value = getDefaultPropertiesState(formSchema.value.definitions.formSchema.properties)
  },
  {
    immediate: true,
    once: true,
  },
)

const errors = computed(() => {
  if (!isTouched.value) return []

  const result = modifiedZodSchema.value.safeParse(formState.value)

  if (result.success) return []
  else return result.error.errors
})

const isTouched = ref(false)

const submit = () => {
  isTouched.value = true

  if (errors.value.length) return

  const result = modifiedZodSchema.value.parse(formState.value)

  console.log(result)
}

provide(autoFormInjectionKey, {
  errors: errors,
  fieldConfig: readonly(fieldConfig),
  formSchema: computed(() => formSchema.value?.definitions?.formSchema),
  isTouched: readonly(isTouched),
})
</script>

<template>
  <pre>
    {{ formState }}
  </pre>
  <pre>{{ fieldsToHide }}</pre>
  <pre>{{ fieldsToRequire }}</pre>
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
