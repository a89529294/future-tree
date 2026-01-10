import { useForm, useStore } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { StoreFormData } from '@/db/schemas'
import { storeFormSchema } from '@/db/schemas/stores'

type StoreFormProps =
  | {
      mode: 'new'
      initialData?: never
      onSubmit: (store: StoreFormData) => Promise<StoreFormData>
    }
  | {
      mode: 'view'
      initialData: StoreFormData
      storeId: string
    }
  | {
      mode: 'edit'
      initialData: StoreFormData
      storeId: string
      onSubmit: (store: StoreFormData) => Promise<StoreFormData>
    }

export function StoreForm(props: StoreFormProps) {
  const isViewMode = props.mode === 'view'

  const form = useForm({
    defaultValues: props.initialData,
    validators: {
      onSubmit: storeFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!isViewMode) {
        await props.onSubmit({
          name: value.name.trim(),
          address: value.address?.trim() || null,
          phoneNumber: value.phoneNumber?.trim() || null,
        })
      }
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>廠商資訊</CardTitle>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field className="space-y-1" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>名稱</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isViewMode || isSubmitting}
                      aria-invalid={isInvalid}

                      // required
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </div>
          <div className="space-y-2">
            <form.Field
              name="address"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field className="space-y-1" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>地址</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? undefined}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isViewMode || isSubmitting}
                      aria-invalid={isInvalid}
                      // required
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </div>
          <div className="space-y-2">
            <form.Field
              name="phoneNumber"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field className="space-y-1" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>電話</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? undefined}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isViewMode || isSubmitting}
                      aria-invalid={isInvalid}
                      // required
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {props.mode === 'view' && (
            <Button asChild>
              <Link
                to="/stores/$storeId/edit"
                params={{ storeId: props.storeId }}
              >
                編輯
              </Link>
            </Button>
          )}

          {props.mode === 'edit' && (
            <>
              <Button variant="outline" asChild>
                <Link
                  disabled={isSubmitting}
                  to="/stores/$storeId"
                  params={{ storeId: props.storeId }}
                >
                  取消編輯
                </Link>
              </Button>
              <Button disabled={isSubmitting} type="submit">
                儲存
              </Button>
            </>
          )}

          {props.mode === 'new' && (
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
              children={({
                canSubmit,
                isSubmitting: isSubmittingFromSubscribe,
              }) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmittingFromSubscribe}
                >
                  {isSubmittingFromSubscribe ? '建立中...' : '建立'}
                </Button>
              )}
            />
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
