import { useForm, useStore } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { StoreFormData } from '@/db/schemas'
import { storeFormSchema } from '@/db/schemas'

type StoreFormProps =
  | {
      mode: 'new'
      initialData?: never
      onSubmit: (store: StoreFormData) => void
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
      onSubmit: (store: StoreFormData) => void
      onDelete: () => void
    }

export function StoreForm(props: StoreFormProps) {
  const isViewMode = props.mode === 'view'

  const form = useForm({
    defaultValues: props.initialData,
    validators: {
      onSubmit: storeFormSchema,
    },
    onSubmit: ({ value }) => {
      if (!isViewMode) {
        props.onSubmit({
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
        <CardFooter className="flex gap-2">
          {props.mode === 'view' && (
            <Button asChild>
              <Link
                className="ml-auto"
                to="/stores/$storeId/edit"
                params={{ storeId: props.storeId }}
              >
                編輯
              </Link>
            </Button>
          )}

          {props.mode === 'edit' && (
            <>
              <AlertDialog>
                <AlertDialogTrigger>
                  <Button type="button" variant={'destructive'}>
                    刪除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={props.onDelete}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button className="ml-auto" variant="outline" asChild>
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
            <Button className="ml-auto" type="submit" disabled={isSubmitting}>
              建立
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
