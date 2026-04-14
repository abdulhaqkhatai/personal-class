# ⚙️ LOCALHOST SETUP - STEP BY STEP

## The Problem

Frontend is live on Vercel pointing to Render (correct for production ✅).  
For **localhost testing**, you need:
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173` or `http://localhost:3000`
- Frontend configured to call `http://localhost:5000` for API

---

## What's Already Configured ✅

| File | Setting | Status |
|------|---------|--------|
| `client/.env` | Production API URL (Render) | ✅ |
| `client/.env.local` | Localhost API URL (localhost:5000) | ✅ |
| `client/vite.config.js` | Proxy /api → localhost:5000 | ✅ |
| `server/.env` | MongoDB connection | ✅ |

---

## Step-by-Step: Running Localhost

### Terminal 1: Start Backend Server

```bash
cd d:\coding\anticode\habbu\server
node server.js
```

**Expected output:**
```
🔧 Loading auth routes...
MongoDB connected
🔧 Mounting /api/auth routes...
🎧 Server running on port 5000
```

✅ **Keep this terminal running**

---

### Terminal 2: Start Frontend Dev Server

```bash
cd d:\coding\anticode\habbu\client
npm start
```

OR if that doesn't work:

```bash
npm run dev
```

**Expected output:**
```
  VITE v... dev server running at:

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Important:** Let it fully compile (you'll see "ready in XXXms")

✅ **Keep this terminal running**

---

### Browser: Test It

**Open:** http://localhost:5173

1. Should see **Login** page
2. Login with:
   ```
   Username: students
   Password: test123
   ```
3. Should see **Marks table** with 5 marks
4. Check browser console (F12):
   - Should NOT have errors
   - Should show "✅ API Response: Array(5)"

---

## Verify Network Traffic

**Open DevTools (F12) → Network Tab**

1. **Before login:**
   - POST /api/auth/login → Status 200 ✅

2. **After login:**
   - GET /api/tests → Status 200 ✅
   - Check Response: Should show marks array

3. **Auto-refresh (every 10 seconds):**
   - GET /api/tests → Keep seeing status 200 ✅

---

## If It's Not Working

### Issue 1: "Cannot GET /api/tests"
**Problem:** Frontend is calling wrong API URL  
**Solution:** 
1. Stop frontend server (Ctrl+C)
2. Delete `node_modules/.vite` cache: `rm -r node_modules/.vite`
3. Restart: `npm start`

### Issue 2: "Backend not running"
**Problem:** Backend on port 5000 is not responding  
**Solution:**
1. Verify terminal 1 shows "MongoDB connected"
2. Check no other app is using port 5000
3. Restart backend: `node server.js`

### Issue 3: "CORS error"
**Problem:** Browser can't call different port  
**Solution:** 
- This is handled by Vite proxy (should work automatically)
- If not, restart both servers

### Issue 4: "Token invalid"
**Problem:** Old token from before code changes  
**Solution:**
1. Logout completely
2. Clear browser cache (F12 → Storage → Clear All)
3. Login again fresh

---

## Troubleshooting Commands

```bash
# Check backend is running
curl http://localhost:5000/api/auth/students

# Test login from terminal
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"students","password":"test123"}'

# Run backend test
cd server
node test-e2e-flow.js
```

---

## Test Credentials (Localhost)

### Class 1 (JIET)
- **Teacher:** `teacher` / `test123`
- **Student:** `students` / `test123`

### Class 2 (Class 2)
- **Teacher:** `class2_teacher` / `test123`
- **Students:** `student_2a` / `test123`, etc.

---

## Expected Flow

1. **Terminal 1:** Server log shows requests
   ```
   GET /api/tests (from student)
   [Request logged with timestamp]
   ```

2. **Terminal 2:** Frontend logs in console (F12)
   ```
   📡 Fetching marks from API...
   ✅ API Response: Array(5)
   ✅ Transformed to 5 test(s)
   ```

3. **Browser:** Marks table appears
   ```
   Maths marks: 60/69, 80/90, 67/80, 67/70, 85/100
   ```

---

## Important Notes

⚠️ **Do NOT change:**
- `client/.env` - This is for production (Vercel)
- Render backend configuration

✅ **Use for localhost:**
- `client/.env.local` - Automatically loaded by Vite for development
- Keeps production config separate

---

## Quick Verification

Run this from server directory:

```bash
node test-frontend-connection.js
```

Will show:
- ✅ Can connect to localhost:5000
- ✅ Can retrieve marks
- ✅ Setup instructions

---

## Summary

| Step | Command | Status |
|------|---------|--------|
| 1. Backend | `cd server && node server.js` | Run in Terminal 1 |
| 2. Frontend | `cd client && npm start` | Run in Terminal 2 |
| 3. Browser | Open http://localhost:5173 | Login & verify |
| 4. Test | F12 Console, check for errors | Should be clean |

---

## Production is Already Correct ✅

- Vercel frontend points to Render backend ✅
- No changes needed ✅
- `.env` file has production URL ✅

**Only `.env.local` is used for localhost development.**

---

**Now run the commands above and test!** 🚀
