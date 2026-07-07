import { useForm, useStore } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publishUnlock, subscribeToDevice, unsubscribeFromDevice } from '@/iot'

export const Route = createFileRoute('/_authenticated/test')({
  component: TestPage,
})

const DOOR_VALUES = ['1', '2', '3', '4', '5'] as const
type DoorValue = (typeof DOOR_VALUES)[number]

const testFormSchema = z.object({
  clientId: z.string().trim().min(1, 'clientId 為必填欄位'),
  doors: z.array(z.enum(DOOR_VALUES)).min(1, '請至少選擇一個門'),
})

type DeviceDataType = 'door' | 'heartbeat'

type DeviceData = {
  door?: { data: unknown; timestamp: number }
  heartbeat?: { data: unknown; timestamp: number }
}

type WsMessage = {
  topic: string
  data: unknown
  timestamp: number
}

function parseTopic(topic: string): {
  clientId: string
  type: DeviceDataType
} | null {
  const parts = topic.split('/')
  if (parts.length !== 3 || parts[0] !== 'state') return null
  const clientId = parts[1]
  const rawType = parts[2]
  if (rawType !== 'door' && rawType !== 'heartbeat') return null
  return { clientId, type: rawType }
}

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleTimeString()
}

function createLastUnlock(clientId: string, cells: Array<number>) {
  return { clientId, cells, timestamp: Date.now() }
}

function TestPage() {
  const [lastUnlock, setLastUnlock] = useState<{
    clientId: string
    cells: Array<number>
    timestamp: number
  } | null>(null)

  const form = useForm({
    defaultValues: {
      clientId: '',
      doors: [] as Array<DoorValue>,
    },
    validators: {
      onSubmit: testFormSchema,
    },
    onSubmit: ({ value }) => {
      const clientId = value.clientId.trim()
      const cells = value.doors.map((door) => Number(door))
      console.log({ clientId, doors: cells })
      publishUnlock({ data: { clientId, cells } })
      setLastUnlock(createLastUnlock(clientId, cells))
      form.reset()
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  const subscribeForm = useForm({
    defaultValues: {
      clientId: '',
    },
  })

  const [subscribedClients, setSubscribedClients] = useState<Array<string>>([])
  const [deviceData, setDeviceData] = useState<Record<string, DeviceData>>({})
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  const connectWebSocket = () => {
    const existing = wsRef.current
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Connected to WebSocket')
      setWsConnected(true)
    }
    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        const parsed = parseTopic(msg.topic)
        if (!parsed) return

        const { clientId, type } = parsed
        setDeviceData((prev) => ({
          ...prev,
          [clientId]: {
            ...prev[clientId],
            [type]: { data: msg.data, timestamp: msg.timestamp },
          },
        }))
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }
    ws.onclose = () => {
      console.log('Disconnected from WebSocket')
      setWsConnected(false)
      wsRef.current = null
    }
  }

  const handleSubscribe = async () => {
    const clientId = subscribeForm.state.values.clientId
    if (!clientId) return

    await subscribeToDevice({ data: { clientId } })
    connectWebSocket()
    setSubscribedClients((prev) =>
      prev.includes(clientId) ? prev : [...prev, clientId],
    )
  }

  const handleUnsubscribe = async () => {
    const clientId = subscribeForm.state.values.clientId
    if (!clientId) return

    await unsubscribeFromDevice({ data: { clientId } })
    setSubscribedClients((prev) => prev.filter((id) => id !== clientId))
    setDeviceData((prev) => {
      const next = { ...prev }
      delete next[clientId]
      return next
    })
  }

  return (
    <div className="p-4 flex">
      <div className="flex-1">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Open Doors</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Last command:</span>
            <Badge variant={lastUnlock ? 'default' : 'secondary'}>
              {lastUnlock
                ? `${lastUnlock.clientId} · doors ${lastUnlock.cells.join(', ')}`
                : 'None sent'}
            </Badge>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4 max-w-md"
        >
          <form.Field
            name="clientId"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field className="space-y-1" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>clientId</FieldLabel>
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

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Unlock'}
            </Button>
          </div>
        </form>

        {lastUnlock && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Last Unlock Command</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{lastUnlock.clientId}</span>
                    <Badge variant="outline">{lastUnlock.clientId}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Cells</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(lastUnlock.timestamp)}
                      </span>
                    </div>
                    <pre className="text-xs bg-muted rounded-md p-2 overflow-auto">
                      {JSON.stringify(
                        {
                          cells: lastUnlock.cells,
                          topic: `cmd/${lastUnlock.clientId}/unlock`,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Subscribe/Unsubscribe</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>WebSocket:</span>
            <Badge variant={wsConnected ? 'default' : 'secondary'}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
          }}
          className="space-y-4 max-w-md"
        >
          <subscribeForm.Field
            name="clientId"
            children={(field) => (
              <Field className="space-y-1">
                <FieldLabel htmlFor={field.name}>clientId</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </Field>
            )}
          />

          <div className="flex gap-3">
            <Button type="button" onClick={handleSubscribe}>
              Subscribe
            </Button>
            <Button type="button" onClick={handleUnsubscribe}>
              Unsubscribe
            </Button>
          </div>
        </form>

        {subscribedClients.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Subscribed Devices</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {subscribedClients.map((clientId) => {
                const info = deviceData[clientId] as DeviceData | undefined
                return (
                  <Card key={clientId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{clientId}</span>
                        <Badge variant="outline">{clientId}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Door</Badge>
                          {info?.door ? (
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(info.door.timestamp)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Waiting for data...
                            </span>
                          )}
                        </div>
                        {info?.door && (
                          <pre className="text-xs bg-muted rounded-md p-2 overflow-auto">
                            {JSON.stringify(info.door.data, null, 2)}
                          </pre>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Heartbeat</Badge>
                          {info?.heartbeat ? (
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(info.heartbeat.timestamp)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Waiting for data...
                            </span>
                          )}
                        </div>
                        {info?.heartbeat && (
                          <pre className="text-xs bg-muted rounded-md p-2 overflow-auto">
                            {JSON.stringify(info.heartbeat.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
