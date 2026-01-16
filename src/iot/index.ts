// app/functions/iot.ts

import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { createServerFn } from '@tanstack/react-start'
import { iot, mqtt } from 'aws-iot-device-sdk-v2'

import { broadcastToClients } from '@/websocket-server'

let connection: mqtt.MqttClientConnection | null = null

// Initialize IoT connection
async function getIoTConnection(): Promise<mqtt.MqttClientConnection> {
  if (connection) return connection

  try {
    // Get IoT endpoint
    const endpoint = 'a1lgre51uh3lnz-ats.iot.ap-east-1.amazonaws.com'

    // Get credentials from EC2 instance role
    const credentialsProvider = fromNodeProviderChain()
    const credentials = await credentialsProvider()

    const configBuilder =
      iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets()
        .with_clean_session(true)
        .with_client_id(`webapp-${Date.now()}`)
        .with_endpoint(endpoint)
        .with_credentials(
          'ap-east-1',
          credentials.accessKeyId,
          credentials.secretAccessKey,
          credentials.sessionToken, // only needed because we are relying on ec2 role in production. if we use accessKeyId and secretAccessKey created in aws iam console then its not needed.
        )

    const config = configBuilder.build()
    const client = new mqtt.MqttClient()
    connection = client.new_connection(config)

    await connection.connect()
    console.log('Connected to AWS IoT Core')

    return connection
  } catch (error) {
    console.error('Failed to connect to IoT Core:', error)
    throw error
  }
}

export const publishUnlock = createServerFn({ method: 'POST' })
  .inputValidator((data: { thingId: string; cells: Array<number> }) => data)
  .handler(async ({ data: { cells, thingId } }) => {
    try {
      const conn = await getIoTConnection()

      const payload = {
        request_id: 'tx_001',
        cells,
        timestamp: Date.now(),
      }

      const topic = `cmd/${thingId}/unlock`

      await conn.publish(topic, JSON.stringify(payload), mqtt.QoS.AtLeastOnce)

      console.log(`Published to ${topic}:`, payload)

      return {
        success: true,
        message: 'Unlock command published',
        payload,
      }
    } catch (error) {
      console.error('Error publishing message:', error)
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    }
  })

export const subscribeToDoorState = createServerFn({ method: 'POST' })
  .inputValidator((data: { thingId: string }) => data)
  .handler(async ({ data: { thingId } }) => {
    try {
      const conn = await getIoTConnection()

      const topic = `state/${thingId}/door`

      await conn.subscribe(
        topic,
        mqtt.QoS.AtLeastOnce,
        (receivedTopic: string, payload: ArrayBuffer) => {
          const message = new TextDecoder('utf-8').decode(payload)
          console.log(`Received message on ${receivedTopic}:`, message)

          try {
            const data = JSON.parse(message)
            // Handle the door state update here
            console.log('Door state:', data)

            // Broadcast to all connected WebSocket clients
            broadcastToClients(receivedTopic, data)
          } catch (e) {
            console.error('Failed to parse message:', e)
          }
        },
      )

      console.log(`Subscribed to ${topic}`)

      return {
        success: true,
        message: `Subscribed to ${topic}`,
      }
    } catch (error) {
      console.error('Error subscribing to topic:', error)
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    }
  })

export const unsubscribeFromDoorState = createServerFn({ method: 'POST' })
  .inputValidator((data: { thingId: string }) => data)
  .handler(async ({ data: { thingId } }) => {
    try {
      const conn = await getIoTConnection()

      const topic = `state/${thingId}/door`

      await conn.unsubscribe(topic)

      console.log(`Unsubscribed from ${topic}`)

      return {
        success: true,
        message: `Unsubscribed from ${topic}`,
      }
    } catch (error) {
      console.error('Error unsubscribing from topic:', error)
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    }
  })
