import { useForm, useStore } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publishUnlock } from '@/iot'

export const Route = createFileRoute('/_authenticated/test')({
  component: TestPage,
})

const DOOR_VALUES = ['1', '2', '3', '4', '5'] as const
type DoorValue = (typeof DOOR_VALUES)[number]

const testFormSchema = z.object({
  thingId: z.string().trim().min(1, 'thingId 為必填欄位'),
  doors: z.array(z.enum(DOOR_VALUES)).min(1, '請至少選擇一個門'),
})

function TestPage() {
  const form = useForm({
    defaultValues: {
      thingId: '',
      doors: [] as Array<DoorValue>,
    },
    validators: {
      onSubmit: testFormSchema,
    },
    onSubmit: ({ value }) => {
      console.log({
        thingId: value.thingId.trim(),
        doors: value.doors.map((door) => Number(door)),
      })
      publishUnlock({
        data: {
          thingId: value.thingId.trim(),
          cells: value.doors.map((door) => Number(door)),
        },
      })
      form.reset()
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Test Page</h1>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-6 max-w-md"
      >
        <form.Field
          name="thingId"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field className="space-y-1" data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>thingId</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  disabled={isSubmitting}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="doors"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field className="space-y-3" data-invalid={isInvalid}>
                <FieldLabel>門號</FieldLabel>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {DOOR_VALUES.map((value) => {
                    const isChecked = field.state.value.includes(value)

                    return (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`door-${value}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const nextValue = checked
                              ? [...field.state.value, value]
                              : field.state.value.filter(
                                  (door) => door !== value,
                                )
                            field.handleChange(nextValue)
                          }}
                          aria-invalid={isInvalid}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={`door-${value}`}>{value}</Label>
                      </div>
                    )
                  })}
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            Submit
          </Button>
        </div>
      </form>
    </div>
  )
}
