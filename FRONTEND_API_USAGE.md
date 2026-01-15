# Frontend API Services - Usage Guide

## 📁 Created Services

All service files are in `src/services/`:

- ✅ `api.ts` - Axios client with auth
- ✅ `auth.service.ts` - Authentication
- ✅ `device.service.ts` - Device management
- ✅ `telemetry.service.ts` - Sensor data

---

## 🔐 1. Authentication Service

### Login

```typescript
import { login } from "../services/auth.service";

const handleLogin = async () => {
  try {
    const result = await login({
      email: "admin@petronas.com",
      password: "Admin@1234",
    });

    // User and tokens are automatically stored
    console.log("Logged in:", result.data.user);
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

### Logout

```typescript
import { logout } from "../services/auth.service";

const handleLogout = async () => {
  await logout();
  // Tokens cleared, redirect to login
};
```

### Check Authentication

```typescript
import { isAuthenticated, getStoredUser } from "../services/auth.service";

if (isAuthenticated()) {
  const user = getStoredUser();
  console.log("Current user:", user);
}
```

---

## 📱 2. Device Service

### Get All Devices (for dropdown)

```typescript
import { getDevices } from "../services/device.service";

const DeviceSelector = () => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      const data = await getDevices();
      setDevices(data.devices);
    };
    fetchDevices();
  }, []);

  return (
    <select>
      {devices.map((device) => (
        <option key={device.id} value={device.id}>
          {device.name}
        </option>
      ))}
    </select>
  );
};
```

---

## 📊 3. Telemetry Service

### Get Latest Readings (for dashboard cards)

```typescript
import { getLatestReadings } from "../services/telemetry.service";

const Dashboard = ({ deviceId }: { deviceId: string }) => {
  const [latestData, setLatestData] = useState(null);

  useEffect(() => {
    const fetchLatest = async () => {
      const data = await getLatestReadings(deviceId, 1);
      setLatestData(data[0]);
    };
    fetchLatest();
  }, [deviceId]);

  return (
    <div>
      <div>SO₂: {latestData?.so2Value} ppm</div>
      <div>NO₂: {latestData?.no2Value} ppm</div>
      <div>Temp: {latestData?.tempValue}°C</div>
    </div>
  );
};
```

### Get Time-Series Data (for charts) 🎯

```typescript
import { getTimeSeriesData } from "../services/telemetry.service";

const ChartComponent = ({ deviceId }: { deviceId: string }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const data = await getTimeSeriesData({
        deviceId,
        startDate: yesterday.toISOString(),
        endDate: now.toISOString(),
        interval: "1h",
        parameters: "so2,no2,temperature",
      });

      // Transform for chart
      const transformed = data.timeSeries.map((item: any) => ({
        time: new Date(item.bucket).getTime(),
        so2: parseFloat(item.so2_avg || 0),
        no2: parseFloat(item.no2_avg || 0),
        temperature: parseFloat(item.temperature_avg || 0),
      }));

      setChartData(transformed);
    };

    fetchChartData();
  }, [deviceId]);

  return (
    <LineChart data={chartData}>
      <XAxis dataKey="time" />
      <Line dataKey="so2" stroke="#8884d8" />
      <Line dataKey="no2" stroke="#82ca9d" />
    </LineChart>
  );
};
```

---

## 🔄 Auto-Refresh Example

```typescript
const useAutoRefresh = (fetchFn: () => Promise<void>, interval = 60000) => {
  useEffect(() => {
    fetchFn(); // Initial fetch

    const timer = setInterval(() => {
      fetchFn();
    }, interval);

    return () => clearInterval(timer);
  }, [fetchFn, interval]);
};

// Usage
const Dashboard = () => {
  const fetchData = async () => {
    const data = await getLatestReadings(deviceId);
    setReadings(data);
  };

  useAutoRefresh(fetchData, 60000); // Refresh every minute

  return <div>{/* ... */}</div>;
};
```

---

## ⚠️ Error Handling

All services automatically handle:

- ✅ 401 errors → Auto token refresh
- ✅ Expired tokens → Redirect to login
- ✅ Network errors → Throw error for component to catch

```typescript
const Component = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLatestReadings(deviceId);
      setReadings(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* data */}</div>;
};
```

---

## 🎯 Next Steps

1. **Update Dashboard Page**

   - Replace mock data imports
   - Use `getLatestReadings()`
   - Add loading/error states

2. **Update Chart Components**

   - Use `getTimeSeriesData()`
   - Transform data for your chart library
   - Add real-time updates

3. **Add Device Selector**

   - Use `getDevices()`
   - Store selected device in state/context
   - Pass to child components

4. **Create Login Page** (if not exists)
   - Use `login()` from auth service
   - Redirect on success
   - Show errors

---

**All services are production-ready!** 🎉  
Just import and use in your React components!
