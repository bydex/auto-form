<script setup lang="ts">
import { z } from 'zod'
import AutoForm from './components/AutoForm/AutoForm.vue'
import AutoFormField from './components/AutoForm/AutoFormField.vue'

enum Sports {
  Football = 'Football/Soccer',
  Basketball = 'Basketball',
  Baseball = 'Baseball',
  Hockey = 'Hockey (Ice)',
  None = "I don't like sports",
}

const schema = z.object({
  guestListName: z.string(),
  invitedGuests: z
    .array(
      z.object({
        name: z.string().min(3),
        age: z.coerce.number().min(18).max(110),
      }),
    )
    .min(3)
    .describe('Guests invited to the party'),

  username: z
    .string({
      required_error: 'Username is required.',
    })
    .min(2, {
      message: 'Username must be at least 2 characters.',
    }),

  password: z
    .string({
      required_error: 'Password is required.',
    })
    .min(8, {
      message: 'Password must be at least 8 characters.',
    }),

  favouriteNumber: z.coerce
    .number({
      invalid_type_error: 'Favourite number must be a number.',
    })
    .min(1, {
      message: 'Favourite number must be at least 1.',
    })
    .max(10, {
      message: 'Favourite number must be at most 10.',
    })
    .default(1)
    .optional(),

  acceptTerms: z.boolean().refine((value) => value, {
    message: 'You must accept the terms and conditions.',
  }),

  sendMeMails: z.boolean().optional(),

  birthday: z.coerce.date().optional(),

  color: z.enum(['red', 'green', 'blue']).optional(),

  // Another enum example
  marshmallows: z.enum(['not many', 'a few', 'a lot', 'too many']),

  // Native enum example
  sports: z.nativeEnum(Sports).describe('What is your favourite sport?'),

  bio: z
    .string()
    .min(10, {
      message: 'Bio must be at least 10 characters.',
    })
    .max(160, {
      message: 'Bio must not be longer than 30 characters.',
    })
    .optional(),

  customParent: z.string().optional(),

  file: z.string({
    required_error: 'Username is required.',
  }),

  subObject: z.object({
    subField: z.string().optional().default('Sub Field Йоу'),
    numberField: z.number().optional().default(1),

    subSubObject: z
      .object({
        subSubField: z.string().min(3).default('Sub Sub Field'),
      })
      .describe('Sub Sub Object Description'),
  }),
  optionalSubObject: z
    .object({
      optionalSubField: z.string().min(2),
      otherOptionalSubField: z.string(),
    })
    .optional(),
})

const fieldConfig = {
  password: {
    label: 'Your secure password',
    inputProps: {
      type: 'password',
      placeholder: '••••••••',
    },
  },
  favouriteNumber: {
    description: 'Your favourite number between 1 and 10.',
  },
  acceptTerms: {
    label: 'Accept terms and conditions.',
    inputProps: {
      required: true,
    },
  },

  birthday: {
    description: 'We need your birthday to send you a gift.',
  },

  sendMeMails: {
    component: 'switch',
  },

  bio: {
    inputProps: {
      type: 'textarea',
    },
  },

  marshmallows: {
    label: 'How many marshmallows fit in your mouth?',
    component: 'radio',
  },

  file: {
    label: 'Text file',
    inputProps: {
      type: 'file',
    },
  },
}
</script>

<template>
  <van-config-provider theme="dark">
    <AutoForm :zod-schema="schema" :field-config="fieldConfig">
      <template #acceptTerms="slotProps">
        <AutoFormField v-bind="slotProps" />
        <div class="terms">
          I agree to the
          <a href="https://google.com" target="_blank">terms and conditions</a>.
        </div>
      </template>

      <template #customParent="slotProps">
        <div class="custom-parent flex items-end">
          <AutoFormField v-bind="slotProps" />
          <van-button type="primary"> Check </van-button>
        </div>
      </template>

      <template #invitedGuests.name="slotProps">
        Hello Йоу
        <AutoFormField v-bind="slotProps" />
      </template>

      <template #subObject.subSubObject.subSubField="slotProps">
        Hello from subsubsub field
        <AutoFormField v-bind="slotProps" />
      </template>
    </AutoForm>
  </van-config-provider>
</template>

<style scoped>
.terms {
  margin-top: var(--van-padding-xs);
  padding: 0 var(--van-cell-horizontal-padding);
}

.custom-parent {
  display: flex;
  align-items: flex-end;
  padding-right: var(--van-cell-horizontal-padding);
}
</style>
