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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { BranchFormData } from '@/db/schemas/resources/branches'

type BranchFormProps =
  | {
      mode: 'new'
      initialData?: Partial<BranchFormData>
      storeId: string
      onSubmit: (branch: BranchFormData) => Promise<void>
    }
  | {
      mode: 'view'
      initialData: BranchFormData
      storeId: string
      branchId: string
    }
  | {
      mode: 'edit'
      initialData: BranchFormData
      storeId: string
      branchId: string
      onSubmit: (branch: BranchFormData) => Promise<void>
    }

export function BranchForm(props: BranchFormProps) {
  const isViewMode = props.mode === 'view'

  const form = useForm({
    defaultValues: {
      name: props.initialData?.name ?? '',
      description: props.initialData?.description ?? '',
      storeId: props.initialData?.storeId ?? '',
    } as BranchFormData,
    onSubmit: async ({ value }) => {
      if (!isViewMode) {
        await props.onSubmit(value)
      }
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>據點資訊</CardTitle>
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
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field className="space-y-1" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>描述</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isViewMode || isSubmitting}
                      aria-invalid={isInvalid}
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
                to="/stores/$storeId/branches/$branchId/edit"
                params={{ storeId: props.storeId, branchId: props.branchId }}
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
                  to="/stores/$storeId/branches/$branchId"
                  params={{ storeId: props.storeId, branchId: props.branchId }}
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
            <Button type="submit" disabled={isSubmitting}>
              建立
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
