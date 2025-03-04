<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import zodToJsonSchema from 'zod-to-json-schema'
import { camelToFlat } from '@/utils/helpers/camel-to-flat'

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
    formState.value = Object.fromEntries(
      Object.entries(formSchema.value.definitions.formSchema.properties).map(([key, value]) => {
        const getDefaultValue = () => {
          if (value.type === 'boolean') return false
          if (value.type === 'number') return 0

          return ''
        }
        return [key, value.default ?? getDefaultValue()]
      }),
    )
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

const getFieldError = (fieldPath) => {
  return (
    errors.value?.find((error) => {
      return error.path.join('.') === fieldPath.join('.')
    })?.message ?? null
  )
}

const isTouched = ref(false)

const submit = () => {
  isTouched.value = true
}

const isRequired = (key) => {
  return (
    formSchema.value.definitions.formSchema.required.includes(key) ??
    fieldConfig.value?.[key]?.inputProps?.required ??
    false
  )
}

const getLabel = (key) => {
  return (
    fieldConfig.value[key]?.label ??
    formSchema.value.definitions.formSchema.properties.description ??
    camelToFlat(key)
  )
}
const getMinimum = (key) => {
  return (
    fieldConfig.value[key]?.inputProps?.min ??
    formSchema.value.definitions.formSchema.properties.minimum ??
    undefined
  )
}
const getMaximum = (key) => {
  return (
    fieldConfig.value[key]?.inputProps?.max ??
    formSchema.value.definitions.formSchema.properties.maximum ??
    undefined
  )
}

const modalToShow = ref(null)
const closeModal = () => {
  modalToShow.value = null
}
const isOpenModal = (key) => {
  return modalToShow.value === key
}
const openModal = (key) => {
  modalToShow.value = key
}

const enumToPickerList = (arr) => {
  return arr.map((item) => ({
    text: item,
    value: item,
  }))
}

const onConfirmPicker = (key, { selectedValues: [selectedValue] }) => {
  formState.value[key] = selectedValue

  closeModal()
}

const onConfirmDatepicker = (key, { selectedValues }) => {
  formState.value[key] = selectedValues.reverse().join('.')

  closeModal()
}
const getDatepickerValue = (value) => {
  return value ? value.split('.').reverse() : undefined
}
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
  >
    <template v-for="(value, key) in formSchema.definitions.formSchema.properties" :key="key">
      <slot :name="key">
        <template v-if="value.format === 'date-time'">
          <van-field
            v-model="formState[key]"
            is-link
            readonly
            :name="key"
            :label="getLabel(key)"
            :error-message="getFieldError([key])"
            label-align="top"
            @click="openModal(key)"
            :required="isRequired(key)"
            v-bind="fieldConfig?.[key]?.inputProps ?? {}"
          />
          <van-popup
            :show="isOpenModal(key)"
            @update:show="
              (value) => {
                if (!value) closeModal()
              }
            "
            destroy-on-close
            position="bottom"
            teleport="#app"
          >
            <van-date-picker
              :model-value="getDatepickerValue(formState[key])"
              @confirm="(payload) => onConfirmDatepicker(key, payload)"
              @cancel="closeModal"
            />
          </van-popup>
        </template>
        <template v-else-if="value?.enum?.length">
          <template v-if="fieldConfig[key]?.component === 'radio'">
            <ErrorMessage :error-message="getFieldError([key])" use-padding>
              <van-radio-group v-model="formState[key]">
                <van-cell-group>
                  <van-cell :title="getLabel(key)" />
                  <van-cell
                    v-for="item in value.enum"
                    @click="formState[key] = item"
                    :key="item"
                    :title="item"
                    clickable
                  >
                    <template #right-icon>
                      <van-radio :name="item" />
                    </template>
                  </van-cell>
                </van-cell-group>
              </van-radio-group>
            </ErrorMessage>
          </template>
          <template v-else>
            <van-field
              v-model="formState[key]"
              is-link
              readonly
              @click="openModal(key)"
              :label="getLabel(key)"
              :error-message="getFieldError([key])"
              label-align="top"
              :required="isRequired(key)"
              v-bind="fieldConfig?.[key]?.inputProps ?? {}"
            />
            <van-popup
              :show="isOpenModal(key)"
              @update:show="
                (value) => {
                  if (!value) closeModal()
                }
              "
              destroy-on-close
              round
              position="bottom"
              teleport="#app"
            >
              <van-picker
                :model-value="[formState[key]]"
                :title="getLabel(key)"
                :columns="enumToPickerList(value.enum)"
                @cancel="closeModal"
                @confirm="(payload) => onConfirmPicker(key, payload)"
              />
            </van-popup>
          </template>
        </template>
        <van-field
          v-else-if="value.type === 'string'"
          v-model="formState[key]"
          :label="getLabel(key)"
          :error-message="getFieldError([key])"
          label-align="top"
          :required="isRequired(key)"
          v-bind="fieldConfig?.[key]?.inputProps ?? {}"
        />
        <template v-else-if="value.type === 'number'">
          <van-field
            v-model="formState[key]"
            :label="getLabel(key)"
            type="number"
            :error-message="getFieldError([key])"
            label-align="top"
            :required="isRequired(key)"
            :min="getMinimum(key)"
            :max="getMaximum(key)"
            v-bind="fieldConfig?.[key]?.inputProps ?? {}"
          />
        </template>
        <template v-else-if="value.type === 'boolean'">
          <template v-if="fieldConfig[key].component === 'switch'">
            <van-cell center :title="getLabel(key)" :required="isRequired(key)">
              <template #right-icon>
                <van-switch
                  v-model="formState[key]"
                  :error-message="getFieldError([key])"
                  v-bind="fieldConfig?.[key]?.inputProps ?? {}"
                />
              </template>
            </van-cell>
          </template>
          <template v-else>
            <van-cell>
              <ErrorMessage :error-message="getFieldError([key])">
                <van-checkbox v-model="formState[key]">{{ getLabel(key) }}</van-checkbox>
              </ErrorMessage>
            </van-cell>
          </template>
        </template>
      </slot>
    </template>

    <van-button @click="submit" type="primary" block>Submit</van-button>
  </van-form>
</template>
