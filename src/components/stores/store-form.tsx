import { Link } from '@tanstack/react-router'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StoreFormProps {
  initialData?: {
    id: string
    name: string
    address: string | null
    phoneNumber: string | null
    isReadOnly: boolean
  }
}

export function StoreForm({ initialData }: StoreFormProps) {
  const [formData, setFormData] = React.useState(
    initialData ?? {
      name: '',
      address: '',
      phoneNumber: '',
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, we would call an API here
    console.log('Saving store data:', formData)
    alert('Store information updated (Mock)')
  }

  const newStoreMode = initialData === undefined
  const editStoreMode = initialData && !initialData.isReadOnly
  const viewStoreMode = initialData && initialData.isReadOnly

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>廠商資訊</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名稱</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={viewStoreMode}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">地址</Label>
            <Input
              id="address"
              name="address"
              value={formData.address ?? ''}
              onChange={handleChange}
              disabled={viewStoreMode}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">電話</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber ?? ''}
              onChange={handleChange}
              disabled={viewStoreMode}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {viewStoreMode && (
            <Button asChild>
              <Link
                to="/stores/$storeId/edit"
                params={{ storeId: initialData.id }}
              >
                編輯
              </Link>
            </Button>
          )}

          {editStoreMode && (
            <>
              <Button variant="outline" asChild>
                <Link
                  to="/stores/$storeId"
                  params={{ storeId: initialData.id }}
                >
                  取消編輯
                </Link>
              </Button>
              <Button type="submit">儲存</Button>
            </>
          )}

          {newStoreMode && <Button type="submit">建立</Button>}
        </CardFooter>
      </form>
    </Card>
  )
}
