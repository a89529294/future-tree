# Complete Guide: EC2 Publishing/Subscribing to IoT Core

## Architecture Overview

- **EC2 Instance**: ap-east-2 (Taipei)
- **IoT Core**: ap-east-1 (Hong Kong)
- **Use Case**: Publish to `/cmd/machine_XX/open`, subscribe to `/ack/machine_XX`

---

## LAYER 1: IAM Policy (for EC2 Role)

**Where**: IAM Console or CLI  
**What**: Allows EC2 to call IoT Core APIs

### Create inline policy on your EC2 IAM role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["iot:Connect", "iot:Publish", "iot:Subscribe", "iot:Receive"],
      "Resource": "*"
    }
  ]
}
```

**Via CLI:**

```bash
aws iam put-role-policy \
  --role-name YourEC2RoleName \
  --policy-name IoTCoreAccess \
  --policy-document file://iam-policy.json
```

---

## LAYER 2: IoT Policy (in IoT Core)

**Where**: IoT Core Console or CLI (in ap-east-1)  
**What**: Defines what MQTT operations are allowed

### Step 1: Create the IoT Policy

Create `iot-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:Connect",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "iot:Publish",
      "Resource": "arn:aws:iot:ap-east-1:YOUR_ACCOUNT_ID:topic/cmd/machine_*"
    },
    {
      "Effect": "Allow",
      "Action": "iot:Subscribe",
      "Resource": "arn:aws:iot:ap-east-1:YOUR_ACCOUNT_ID:topicfilter/ack/machine_*"
    },
    {
      "Effect": "Allow",
      "Action": "iot:Receive",
      "Resource": "arn:aws:iot:ap-east-1:YOUR_ACCOUNT_ID:topic/ack/machine_*"
    }
  ]
}
```

**Create in IoT Core:**

```bash
aws iot create-policy \
  --policy-name "VendingMachinePolicy" \
  --policy-document file://iot-policy.json \
  --region ap-east-1
```

### Step 2: Attach IoT Policy to EC2 IAM Role

```bash
aws iot attach-policy \
  --policy-name "VendingMachinePolicy" \
  --target "arn:aws:iam::YOUR_ACCOUNT_ID:role/YourEC2RoleName" \
  --region ap-east-1
```

---

## Get Your IoT Endpoint

```bash
aws iot describe-endpoint \
  --endpoint-type iot:Data-ATS \
  --region ap-east-1
```

This returns something like: `abc123def456.iot.ap-east-1.amazonaws.com`

---

## Node.js Application Code

### Install Dependencies

```bash
npm install aws-iot-device-sdk-v2
```

### Application Code

```javascript
const mqtt = require('aws-iot-device-sdk-v2')
const { iot, mqtt: mqtt_sdk } = mqtt

// Your IoT endpoint from the describe-endpoint command
const IOT_ENDPOINT = 'YOUR_ENDPOINT.iot.ap-east-1.amazonaws.com'

async function connectToIoT() {
  try {
    // Build MQTT connection with WebSocket + IAM credentials
    const config =
      iot.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket()
        .with_clean_session(true)
        .with_client_id(`taipei-ec2-${Date.now()}`) // Unique client ID
        .with_endpoint(IOT_ENDPOINT)
        .with_credentials_provider(
          // Automatically uses EC2 instance role credentials
          mqtt.AwsCredentialsProvider.newDefault(),
        )
        .build()

    const client = new mqtt_sdk.MqttClient()
    const connection = client.new_connection(config)

    // Connect to IoT Core
    await connection.connect()
    console.log('✅ Connected to IoT Core')

    // Subscribe to acknowledgment topics
    const machines = ['machine_01', 'machine_02', 'machine_03']

    for (const machine of machines) {
      await connection.subscribe(
        `ack/${machine}`,
        mqtt_sdk.QoS.AtLeastOnce,
        (topic, payload) => {
          const message = payload.toString()
          console.log(`📨 Received from ${topic}: ${message}`)

          // Handle acknowledgment
          handleAck(machine, JSON.parse(message))
        },
      )
      console.log(`👂 Subscribed to ack/${machine}`)
    }

    return connection
  } catch (error) {
    console.error('❌ Connection failed:', error)
    throw error
  }
}

async function publishCommand(connection, machineId, command) {
  const topic = `cmd/${machineId}/open`
  const payload = JSON.stringify({
    action: command,
    timestamp: new Date().toISOString(),
    requestId: `req_${Date.now()}`,
  })

  try {
    await connection.publish(topic, payload, mqtt_sdk.QoS.AtLeastOnce)
    console.log(`📤 Published to ${topic}: ${payload}`)
  } catch (error) {
    console.error(`❌ Publish failed:`, error)
  }
}

function handleAck(machineId, data) {
  // Your business logic here
  console.log(`Processing ACK from ${machineId}:`, data)

  if (data.status === 'success') {
    console.log(`✅ ${machineId} dispensed successfully`)
  } else {
    console.log(`⚠️ ${machineId} failed: ${data.error}`)
  }
}

// Main application
async function main() {
  const connection = await connectToIoT()

  // Example: User pays for product on machine_01
  setTimeout(() => {
    publishCommand(connection, 'machine_01', 'dispense_product')
  }, 2000)

  // Keep connection alive
  process.on('SIGINT', async () => {
    console.log('Disconnecting...')
    await connection.disconnect()
    process.exit(0)
  })
}

main().catch(console.error)
```

---

## Complete Checklist

- [ ] EC2 instance has IAM role attached
- [ ] IAM role has policy allowing `iot:Connect`, `iot:Publish`, `iot:Subscribe`, `iot:Receive`
- [ ] IoT Policy created in ap-east-1 with correct topic patterns
- [ ] IoT Policy attached to EC2 IAM role ARN
- [ ] IoT endpoint retrieved from `describe-endpoint`
- [ ] Node.js app installed with `aws-iot-device-sdk-v2`
- [ ] Code updated with correct endpoint

---

## Key Notes

1. **Both layers are required** for MQTT subscribe/publish
2. **Region matters**: IoT policy must be in ap-east-1 (where IoT Core is)
3. **Wildcards work**: `machine_*` covers all machine IDs
4. **Subscribe vs Receive**:
   - `iot:Subscribe` = permission to subscribe to topic filter
   - `iot:Receive` = permission to receive messages on topics
5. **WebSocket connection**: Uses port 443, works through most firewalls

This is the complete, correct setup! 🎯
