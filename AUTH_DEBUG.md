# Quick Auth Debugging Guide

## Test File Created

Open `test-auth.html` in your browser to manually test the auth flow:

```
file:///C:/Users/arif/Downloads/petronas-monitoring-system-dashboard/petronas-monitoring-system-dashboard/test-auth.html
```

## Steps:

1. **Test Login**

   - Click "Test Login"
   - Should return tokens
   - Tokens stored in localStorage

2. **Test Get Devices**

   - Click "Test Get Devices"
   - Should return devices (200)
   - If 401, token is not being sent or invalid

3. **Check Tokens**
   - Click "Show Tokens"
   - Verify tokens exist

## Expected Results:

✅ **Login:** Should return `success: true` with tokens  
✅ **Get Devices:** Should return device list (not 401)  
✅ **Tokens:** Should show JWT strings (not NONE)

## If Get Devices Returns 401:

The token IS being sent but rejected by backend. This means:

- Token might be malformed
- Auth middleware might be buggy
- JWT secret mismatch

**Check backend logs when clicking "Test Get Devices"**

---

## Alternative: Test with curl

```powershell
# 1. Login
$login = curl.exe -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"superAdmin@petronas.com\",\"password\":\"Test@1234\"}' | ConvertFrom-Json

# 2. Extract token
$token = $login.data.tokens.accessToken

# 3. Get devices
curl.exe http://localhost:5000/api/devices?status=active `
  -H "Authorization: Bearer $token"
```

If this works but the frontend doesn't, it's an axios/React issue.  
If this also fails, it's a backend auth issue.
