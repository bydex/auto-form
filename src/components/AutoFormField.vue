<script>
defineProps({
  type: {
    type: String,
    default: 'string',
  },
  component: {
    type: String,
  },
  format: {
    type: String,
  },
})

const modelValue = defineModel({
  type: String,
  required: true,
})
</script>

<template>
  <template v-if="format === 'date-time'">
    <van-field
      v-model="modelValue"
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
        :model-value="getDatepickerValue(modelValue)"
        @confirm="(payload) => onConfirmDatepicker(key, payload)"
        @cancel="closeModal"
      />
    </van-popup>
  </template>
  <template v-else-if="value?.enum?.length">
    <template v-if="component === 'radio'">
      <ErrorMessage :error-message="getFieldError([key])" use-padding>
        <van-radio-group v-model="modelValue">
          <van-cell-group>
            <van-cell :title="getLabel(key)" />
            <van-cell
              v-for="item in value.enum"
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
          :model-value="[modelValue]"
          :title="getLabel(key)"
          :columns="enumToPickerList(value.enum)"
          @cancel="closeModal"
          @confirm="(payload) => onConfirmPicker(key, payload)"
        />
      </van-popup>
    </template>
  </template>
  <van-field
    v-else-if="type === 'string'"
    v-model="modelValue"
    :label="getLabel(key)"
    :error-message="getFieldError([key])"
    label-align="top"
    :required="isRequired(key)"
    v-bind="fieldConfig?.[key]?.inputProps ?? {}"
  />
  <template v-else-if="type === 'number'">
    <van-field
      v-model="modelValue"
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
  <template v-else-if="type === 'boolean'">
    <template v-if="component === 'switch'">
      <van-cell center :title="getLabel(key)" :required="isRequired(key)">
        <template #right-icon>
          <van-switch
            v-model="modelValue"
            :error-message="getFieldError([key])"
            v-bind="fieldConfig?.[key]?.inputProps ?? {}"
          />
        </template>
      </van-cell>
    </template>
    <template v-else>
      <van-cell>
        <ErrorMessage :error-message="getFieldError([key])">
          <van-checkbox v-model="modelValue">{{ getLabel(key) }}</van-checkbox>
        </ErrorMessage>
      </van-cell>
    </template>
  </template>
</template>
