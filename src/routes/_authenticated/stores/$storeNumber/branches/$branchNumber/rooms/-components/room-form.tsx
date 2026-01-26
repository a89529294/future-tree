import { useForm, useStore } from '@tanstack/react-form'

import { RouterLink } from '@/components/router-link'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Room, RoomFormData } from '@/db/schemas/resources/rooms'
import { roomFormSchema } from '@/db/schemas/resources/rooms'

type RoomFormProps =
  | {
      mode: 'new'
      initialData?: never
      storeNumber: string
      branchNumber: string
      onSubmit: (room: RoomFormData) => Promise<void>
    }
  | {
      mode: 'view'
      initialData: Room
      storeNumber: string
      branchNumber: string
      roomNumber: string
    }
  | {
      mode: 'edit'
      initialData: Room
      storeNumber: string
      branchNumber: string
      roomNumber: string
      onSubmit: (room: RoomFormData) => Promise<void>
    }

export function RoomForm(props: RoomFormProps) {
  const isViewMode = props.mode === 'view'

  const form = useForm({
    defaultValues: props.initialData
      ? {
          name: props.initialData.name,
          description: props.initialData.description,
          status: props.initialData.status,
        }
      : {
          name: '',
          description: null,
          status: 'active' as const,
        },
    validators: {
      onSubmit: roomFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!isViewMode) {
        await props.onSubmit(value)
      }
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  console.log(isSubmitting)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>房間資訊</CardTitle>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <CardContent className="space-y-4">
          <div className="flex justify-between gap-4">
            <Field className="space-y-1">
              <FieldLabel htmlFor="storeNumber">集團 ID</FieldLabel>
              <Input
                id="storeNumber"
                name="storeNumber"
                value={props.storeNumber}
                disabled
                className="bg-muted opacity-50 cursor-not-allowed"
              />
            </Field>

            <Field className="space-y-1">
              <FieldLabel htmlFor="branchNumber">店家 ID</FieldLabel>
              <Input
                id="branchNumber"
                name="branchNumber"
                value={props.branchNumber}
                disabled
                className="bg-muted opacity-50 cursor-not-allowed"
              />
            </Field>
          </div>

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
              name="status"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field className="space-y-1" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>狀態</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as 'active' | 'inactive')
                      }
                      disabled={isViewMode || isSubmitting}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="選擇狀態" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">使用中</SelectItem>
                        <SelectItem value="inactive">未使用</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isViewMode || isSubmitting}
                      aria-invalid={isInvalid}
                      className="min-h-[100px]"
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
              <RouterLink
                to="/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber/edit"
                params={{
                  storeNumber: props.storeNumber,
                  branchNumber: props.branchNumber,
                  roomNumber: props.roomNumber,
                }}
              >
                編輯
              </RouterLink>
            </Button>
          )}

          {props.mode === 'edit' && (
            <>
              <Button variant="outline" asChild>
                <RouterLink
                  disabled={isSubmitting}
                  to="/stores/$storeNumber/branches/$branchNumber/rooms/$roomNumber"
                  params={{
                    storeNumber: props.storeNumber,
                    branchNumber: props.branchNumber,
                    roomNumber: props.roomNumber,
                  }}
                >
                  取消編輯
                </RouterLink>
              </Button>
              <Button disabled={isSubmitting} type="submit">
                儲存
              </Button>
            </>
          )}

          {props.mode === 'new' && (
            <>
              <Button variant="outline" asChild>
                <RouterLink
                  disabled={isSubmitting}
                  to="/stores/$storeNumber/branches/$branchNumber"
                  search={{ tab: 'rooms' }}
                  params={{
                    storeNumber: props.storeNumber,
                    branchNumber: props.branchNumber,
                  }}
                >
                  取消
                </RouterLink>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                建立
              </Button>
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
