<script setup>
import { camelToFlat } from '@/utils/helpers/camel-to-flat'
import { autoFormInjectionKey } from '@/utils/helpers/keys'
import { inject, ref, toRefs, computed, useSlots } from 'vue'
import AutoFormObject from './AutoFormObject.vue'
import AutoFormArray from './AutoFormArray.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    default: '',
  },
})

const modelValue = defineModel({
  type: [String, Boolean, Number, Object],
  required: true,
})

const { id: fieldId, path } = toRefs(props)

const injected = inject(autoFormInjectionKey)

if (!injected.errors || !injected.fieldConfig || !injected.formSchema) {
  throw new Error('There is no required params')
}

const { errors, fieldConfig, formSchema, isTouched } = injected

const errorMessage = computed(() => {
  const fieldPath = path.value || fieldId.value

  const error = errors.value?.find((error) => {
    return error.path.join('.') === fieldPath
  })?.message

  if (error) return error

  if (isRequired.value && isTouched.value && !modelValue.value) return 'Required'

  return null
})

const isRequired = computed(() => {
  return formSchema.value?.required?.includes(fieldId.value) ?? inputProps.value?.required ?? false
})

const fieldLabel = computed(() => {
  return (
    currentFieldConfig.value?.label ??
    currentSchemaProperty.value.description ??
    camelToFlat(fieldId.value)
  )
})
const minValue = computed(() => {
  return (
    currentFieldConfig.value?.inputProps?.min ?? currentSchemaProperty.value.minimum ?? undefined
  )
})
const maxValue = computed(() => {
  return (
    currentFieldConfig.value?.inputProps?.max ?? currentSchemaProperty.value.maximum ?? undefined
  )
})

const modalToShow = ref(null)
const closeModal = () => {
  modalToShow.value = null
}
const isOpenModal = computed(() => {
  return modalToShow.value === fieldId.value
})
const openModal = () => {
  modalToShow.value = fieldId.value
}

const enumToPickerList = (arr) => {
  return arr.map((item) => ({
    text: item,
    value: item,
  }))
}

const onConfirmPicker = ({ selectedValues: [selectedValue] }) => {
  modelValue.value = selectedValue

  closeModal()
}

const onConfirmDatepicker = ({ selectedValues }) => {
  modelValue.value = selectedValues.reverse().join('.')

  closeModal()
}
const getDatepickerValue = (value) => {
  return value ? value.split('.').reverse() : undefined
}

const currentSchemaProperty = computed(() => formSchema.value.properties[fieldId.value])
const currentFieldConfig = computed(() => fieldConfig.value[fieldId.value])
const inputProps = computed(() => currentFieldConfig.value?.inputProps ?? {})
</script>

<template>
  <template v-if="currentSchemaProperty.format === 'date-time'">
    <van-field
      v-model="modelValue"
      is-link
      readonly
      :name="fieldId"
      :label="fieldLabel"
      :error-message="errorMessage"
      label-align="top"
      @click="openModal"
      :required="isRequired"
      v-bind="inputProps"
    />
    <van-popup
      :show="isOpenModal"
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
        :model-value="getDatepickerValue(modelValue)"
        @confirm="onConfirmDatepicker"
        @cancel="closeModal"
      />
    </van-popup>
  </template>
  <template v-else-if="currentSchemaProperty?.enum?.length">
    <template v-if="currentFieldConfig?.component === 'radio'">
      <ErrorMessage :error-message="errorMessage" use-padding>
        <van-radio-group v-model="modelValue">
          <van-cell-group>
            <van-cell :title="fieldLabel" />
            <van-cell
              v-for="item in currentSchemaProperty.enum"
              @click="modelValue = item"
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
        v-model="modelValue"
        is-link
        readonly
        @click="openModal"
        :label="fieldLabel"
        :error-message="errorMessage"
        label-align="top"
        :required="isRequired"
        v-bind="inputProps"
      />
      <van-popup
        :show="isOpenModal"
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
          :model-value="[modelValue]"
          :title="fieldLabel"
          :columns="enumToPickerList(currentSchemaProperty.enum)"
          @cancel="closeModal"
          @confirm="onConfirmPicker"
        />
      </van-popup>
    </template>
  </template>
  <van-field
    v-else-if="currentSchemaProperty.type === 'string'"
    v-model="modelValue"
    :label="fieldLabel"
    :error-message="errorMessage"
    label-align="top"
    :required="isRequired"
    v-bind="inputProps"
  />
  <template v-else-if="currentSchemaProperty.type === 'number'">
    <van-field
      :model-value="modelValue"
      @update:model-value="(value) => (modelValue = parseFloat(value))"
      :label="fieldLabel"
      type="number"
      :error-message="errorMessage"
      label-align="top"
      :required="isRequired"
      :min="minValue"
      :max="maxValue"
      v-bind="inputProps"
    />
  </template>
  <template v-else-if="currentSchemaProperty.type === 'boolean'">
    <template v-if="currentFieldConfig?.component === 'switch'">
      <van-cell center :title="fieldLabel" :required="isRequired">
        <template #right-icon>
          <van-switch v-model="modelValue" :error-message="errorMessage" v-bind="inputProps" />
        </template>
      </van-cell>
    </template>
    <template v-else>
      <van-cell>
        <ErrorMessage :error-message="errorMessage">
          <van-checkbox v-model="modelValue">{{ fieldLabel }}</van-checkbox>
        </ErrorMessage>
      </van-cell>
    </template>
  </template>
  <template v-else-if="currentSchemaProperty.type === 'object'">
    <AutoFormObject
      :id="id"
      v-model="modelValue"
      :path="path"
      :error-message="errorMessage"
      :required="isRequired"
    >
      <template v-slot:[slot]="slotProps" v-for="slot in Object.keys($slots)">
        <slot :name="slot" v-bind="slotProps" />
      </template>
    </AutoFormObject>
  </template>
  <template v-else-if="currentSchemaProperty.type === 'array'">
    <AutoFormArray
      :id="id"
      v-model="modelValue"
      :path="path"
      :error-message="errorMessage"
      :required="isRequired"
    >
      <template v-slot:[slot]="slotProps" v-for="slot in Object.keys($slots)">
        <slot :name="slot" v-bind="slotProps" />
      </template>
    </AutoFormArray>
  </template>
</template>
