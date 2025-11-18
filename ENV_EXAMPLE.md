# Environment Configuration

This document explains how to configure API endpoints for the ElderConnect mobile app.

## Configuration Methods

### Method 1: app.json (Recommended)

Edit `app.json` and update the `extra` section:

```json
{
  "expo": {
    "extra": {
      "DEV_API_PORT": "5000",
      "DEV_API_IP": "http://127.0.0.1:5000",
      "TUNNEL_URL": "https://your-tunnel-url.ngrok-free.dev"
    }
  }
}
```

After updating, restart your Expo development server:
```bash
npm start
```

### Method 2: Direct Configuration

Edit `constants/API.ts` and set the values directly:

```typescript
export const DEV_API_PORT = '5000';
export const DEV_API_IP = 'http://127.0.0.1:5000';
export const TUNNEL_URL = 'https://your-tunnel-url.ngrok-free.dev';
```

## Configuration Variables

### DEV_API_PORT
- **Default**: `'5000'`
- **Description**: The port number where your backend server runs locally
- **Example**: `'5000'`

### DEV_API_IP
- **Default**: `'http://127.0.0.1:5000'`
- **Description**: Local development API URL (for emulator/simulator)
- **Note**: Use `http://10.0.2.2:5000` for Android emulator
- **Note**: Use `http://localhost:5000` or `http://127.0.0.1:5000` for iOS simulator
- **Example**: `'http://127.0.0.1:5000'`

### TUNNEL_URL
- **Default**: `''` (empty string)
- **Description**: Public tunnel URL (ngrok, localtunnel, etc.) for testing on real devices
- **Priority**: If set, this URL will be used instead of DEV_API_IP
- **Example**: `'https://vesical-superloyally-reese.ngrok-free.dev'`

## Usage Priority

The API configuration uses the following priority:

1. **TUNNEL_URL** (if set) - Used when testing on real devices
2. **DEV_API_IP** - Used for local development (emulator/simulator)
3. **Fallback** - `http://localhost:${DEV_API_PORT}`

## Example Usage in Code

```typescript
import { API_BASE_URL, apiEndpoint } from '@/constants/API';
import { apiGet, apiPost } from '@/services/api';

// Get API base URL
console.log(API_BASE_URL); // e.g., 'https://tunnel-url.ngrok-free.dev'

// Make API calls
const response = await apiGet('/users/profile');
const result = await apiPost('/auth/login', { phone: '+94771234567' });
```

## Testing Scenarios

### Local Development (Emulator/Simulator)
```json
{
  "DEV_API_IP": "http://127.0.0.1:5000",
  "TUNNEL_URL": ""
}
```

### Real Device Testing (with Tunnel)
```json
{
  "DEV_API_IP": "http://127.0.0.1:5000",
  "TUNNEL_URL": "https://your-tunnel.ngrok-free.dev"
}
```

### Production
```json
{
  "DEV_API_IP": "",
  "TUNNEL_URL": "https://api.elderconnect.com"
}
```

## Current Configuration

Based on your setup:
- **DEV_API_PORT**: `'5000'`
- **DEV_API_IP**: `'http://127.0.0.1:4040'` (Note: This is ngrok web interface, should be `http://127.0.0.1:5000` for backend)
- **TUNNEL_URL**: `'https://vesical-superloyally-reese.ngrok-free.dev'`

**Note**: The tunnel URL will be used when set, so your app will connect to the tunnel URL automatically.

## Troubleshooting

### App not connecting to backend
1. Check if backend server is running: `npm run dev` in backend folder
2. Check if tunnel is running: `npm run tunnel` in backend folder
3. Verify the tunnel URL is correct in `app.json`
4. Check console logs for API configuration

### CORS errors
- Make sure your backend CORS settings allow your app's origin
- Update `CORS_ORIGIN` in backend `.env` to include your tunnel URL

### Network errors on real device
- Ensure tunnel is running and URL is correct
- Check that your device has internet connection
- Verify backend server is running

