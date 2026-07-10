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

async function resetConnection() {
  if (!connection) return
  try {
    await connection.disconnect()
  } catch (error) {
    console.error('Failed to disconnect stale MQTT connection:', error)
  }
  connection = null
}

function isStaleSessionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('AWS_ERROR_MQTT_CANCELLED_FOR_CLEAN_SESSION')
}

async function withMqttRetry<T>(
  operation: (conn: mqtt.MqttClientConnection) => Promise<T>,
): Promise<T> {
  try {
    const conn = await getIoTConnection()
    return await operation(conn)
  } catch (error) {
    if (!isStaleSessionError(error)) throw error
    console.log('MQTT connection stale, reconnecting and retrying...')
    await resetConnection()
    const conn = await getIoTConnection()
    return await operation(conn)
  }
}

export const publishUnlock = createServerFn({ method: 'POST' })
  .inputValidator((data: { clientId: string; cells: Array<number> }) => data)
  .handler(async ({ data: { cells, clientId } }) => {
    try {
      const payload = {
        request_id: 'tx_001',
        cells,
        timestamp: Date.now(),
      }

      const topic = `cmd/${clientId}/unlock`

      await withMqttRetry(async (conn) => {
        await conn.publish(topic, JSON.stringify(payload), mqtt.QoS.AtLeastOnce)
      })

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

function handleMqttMessage(receivedTopic: string, payload: ArrayBuffer) {
  const message = new TextDecoder('utf-8').decode(payload)
  console.log(`Received message on ${receivedTopic}:`, message)

  try {
    const data = JSON.parse(message)
    broadcastToClients(receivedTopic, data)
  } catch (e) {
    console.error('Failed to parse message:', e)
  }
}

export const subscribeToDevice = createServerFn({ method: 'POST' })
  .inputValidator((data: { clientId: string }) => data)
  .handler(async ({ data: { clientId } }) => {
    try {
      const doorTopic = `state/${clientId}/door`
      const heartbeatTopic = `state/${clientId}/heartbeat`

      await withMqttRetry(async (conn) => {
        await conn.subscribe(
          doorTopic,
          mqtt.QoS.AtLeastOnce,
          handleMqttMessage,
        )
        await conn.subscribe(
          heartbeatTopic,
          mqtt.QoS.AtLeastOnce,
          handleMqttMessage,
        )
      })

      console.log(`Subscribed to ${doorTopic} and ${heartbeatTopic}`)

      return {
        success: true,
        message: `Subscribed to ${doorTopic} and ${heartbeatTopic}`,
      }
    } catch (error) {
      console.error('Error subscribing to topics:', error)
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    }
  })

export const unsubscribeFromDevice = createServerFn({ method: 'POST' })
  .inputValidator((data: { clientId: string }) => data)
  .handler(async ({ data: { clientId } }) => {
    try {
      const doorTopic = `state/${clientId}/door`
      const heartbeatTopic = `state/${clientId}/heartbeat`

      await withMqttRetry(async (conn) => {
        await conn.unsubscribe(doorTopic)
        await conn.unsubscribe(heartbeatTopic)
      })

      console.log(`Unsubscribed from ${doorTopic} and ${heartbeatTopic}`)

      return {
        success: true,
        message: `Unsubscribed from ${doorTopic} and ${heartbeatTopic}`,
      }
    } catch (error) {
      console.error('Error unsubscribing from topics:', error)
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    }
  })
