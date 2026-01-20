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
import { Spinner } from '@/components/ui/spinner'
import type { Branch, BranchFormData } from '@/db/schemas/resources/branches'
import { branchFormSchema } from '@/db/schemas/resources/branches'
import { useCounties, useDistricts } from '@/queries/tw-address'

type BranchFormProps =
  | {
      mode: 'new'
      initialData?: never
      storeNumber: string
      onSubmit: (branch: BranchFormData) => void
    }
  | {
      mode: 'view'
      initialData: Branch
      storeNumber: string
      branchNumber: string
    }
  | {
      mode: 'edit'
      initialData: Branch
      storeNumber: string
      branchNumber: string
      onSubmit: (branch: BranchFormData) => void
    }

export function BranchForm(props: BranchFormProps) {
  const isViewMode = props.mode === 'view'

  const { queryResult: countiesQuery, nameToCode, codeToName } = useCounties()
  const form = useForm({
    defaultValues: props.initialData
      ? {
          name: props.initialData.name,
          city: props.initialData.city
            ? nameToCode[props.initialData.city]
            : '',
          district: props.initialData.district,
          address: props.initialData.address,
          phoneNumber: props.initialData.phoneNumber,
        }
      : {
          name: '',
          city: '',
          district: '',
          address: '',
          phoneNumber: null,
        },
    validators: {
      onSubmit: branchFormSchema,
    },
    onSubmit: ({ value }) => {
      console.log(value)
      if (!isViewMode) {
        props.onSubmit({
          name: value.name,
          city: value.city ? codeToName[value.city] : '',
          district: value.district,
          address: value.address,
          phoneNumber: value.phoneNumber,
        })
      }
    },
  })
  const selectedCity = useStore(form.store, (state) => state.values.city)
  const countyCode = selectedCity
  const districtsQuery = useDistricts(countyCode)

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>店家資訊</CardTitle>
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
            <Field className="space-y-1">
              <FieldLabel htmlFor="branchNumber">店家 ID</FieldLabel>
              <Input
                id="branchNumber"
                name="branchNumber"
                value={
                  props.mode === 'new'
                    ? '自動生成'
                    : props.initialData.branchNumber
                }
                disabled
                className="bg-muted opacity-50 cursor-not-allowed"
              />
            </Field>
          </div>
          <div className="space-y-2">
            <Field className="space-y-1">
              <FieldLabel htmlFor="storeNumber">集團 ID</FieldLabel>
              <Input
                id="storeNumber"
                name="storeNumber"
                value={
                  props.mode === 'new'
                    ? props.storeNumber
                    : props.initialData.storeNumber
                }
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <form.Field
                name="city"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field className="space-y-1" data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>城市</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => {
                          field.handleChange(value)
                          form.setFieldValue('district', '')
                        }}
                        disabled={isViewMode || isSubmitting}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="選擇城市" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {countiesQuery.isError ? (
                            <SelectItem key={'error'} value={'error'}>
                              無法讀取縣市
                            </SelectItem>
                          ) : countiesQuery.isPending ? (
                            <SelectItem
                              className="flex justify-center"
                              key={'loading'}
                              value={'loading'}
                            >
                              <Spinner />
                            </SelectItem>
                          ) : (
                            countiesQuery.data.map((county) => (
                              <SelectItem
                                key={county.value}
                                value={county.value}
                              >
                                {county.label}
                              </SelectItem>
                            ))
                          )}
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
                name="district"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field className="space-y-1" data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>區域</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                        disabled={isViewMode || isSubmitting || !selectedCity}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="選擇區域" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {districtsQuery.isError ? (
                            <SelectItem key={'error'} value={'error'}>
                              無法讀取鄉鎮
                            </SelectItem>
                          ) : districtsQuery.isPending ? (
                            <SelectItem
                              className="flex justify-center"
                              key={'loading'}
                              value={'loading'}
                            >
                              <Spinner />
                            </SelectItem>
                          ) : (
                            districtsQuery.data.map((district) => (
                              <SelectItem
                                key={district.value}
                                value={district.label}
                              >
                                {district.label}
                              </SelectItem>
                            ))
                          )}
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
              name="phoneNumber"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field className="space-y-1" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>電話號碼</FieldLabel>
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
              <RouterLink
                to="/stores/$storeNumber/branches/$branchNumber/edit"
                params={{
                  storeNumber: props.storeNumber,
                  branchNumber: props.branchNumber,
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
                  to="/stores/$storeNumber/branches/$branchNumber"
                  params={{
                    storeNumber: props.storeNumber,
                    branchNumber: props.branchNumber,
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
            <Button type="submit" disabled={isSubmitting}>
              建立
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
