1. fromNodeProviderChain

```js
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'

const configBuilder =
  iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets()
    .with_clean_session(true)
    .with_client_id(`webapp-${Date.now()}`)
    .with_endpoint(endpoint)
    .with_credentials(
      'ap-east-1',
      credentials.accessKeyId,
      credentials.secretAccessKey,
      credentials.sessionToken,
    )
```

The full credential provider chain includes:

Environment variables - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
Web Identity Token - For workloads running with OIDC (like GitHub Actions, Kubernetes)
Shared credentials file - ~/.aws/credentials
Shared config file - ~/.aws/config (if it contains credentials)
ECS container credentials - From ECS task role metadata
EC2 instance metadata - From EC2 instance role
SSO credentials - If you use AWS SSO

2. direct

```js
const configBuilder =
  iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets()
    .with_clean_session(true)
    .with_client_id(`webapp-${Date.now()}`)
    .with_endpoint(endpoint)
    .with_credentials(
      'ap-east-1',
      process.env.accessKeyId,
      process.env.secretAccessKey,
    )
```
