# 🚀 LOCALHOST TESTING - QUICK CHECKLIST

## ✅ Everything is Already Configured

- ✅ `.env.local` points to http://localhost:5000
- ✅ `vite.config.js` has proxy setup
- ✅ Production `.env` has Render URL (don't change)

## 🎯 To Fix the Issue Right Now

### Step 1: Kill All Running Servers
Press **Ctrl+C** in any open terminals

### Step 2: Terminal 1 - Start Backend
```bash
cd d:\coding\anticode\habbu\server
node server.js
```

Wait for: `🎧 Server running on port 5000`

### Step 3: Terminal 2 - Start Frontend
```bash
cd d:\coding\anticode\habbu\client
npm start
```

(or `npm run dev`)

Wait for: `Local: http://localhost:5173/`

### Step 4: Browser - Test
1. Open http://localhost:5173
2. Login: `students` / `test123`
3. **Should see marks table with 5 entries** ✅

### Step 5: Verify It Works
Open browser console (F12):
- Should show: `📡 Fetching marks from API...`
- Should show: `✅ API Response: Array(5)`
- **No error messages** ✅

---

## Why This Should Work Now

1. **Backend change:** Fixed code in StudentView.jsx ✅
2. **Frontend rebuild:** `npm start` rebuilds with new code ✅
3. **API routing:** `.env.local` routes to localhost:5000 ✅
4. **Token handling:** Improved to work with fresh login ✅

---

## If It STILL Doesn't Work

**Check these in order:**

1. **Is backend running?**
   ```
   In Terminal 1, you should see:
   - "MongoDB connected"
   - "Server running on port 5000"
   ```

2. **Is frontend compiled?**
   ```
   In Terminal 2, should see:
   - "VITE dev server running"
   - No error messages
   ```

3. **Check browser console (F12):**
   - Any red errors?
   - What does the network tab show for /api/tests calls?

4. **Clear cache:**
   ```
   F12 → Application → Local Storage → Delete ma_token and ma_current
   Then refresh page
   ```

---

## Test Credentials

```
Username: students
Password: test123

OR try new class:

Username: student_2a
Password: test123
```

---

## Expected Behavior

1. Login page loads ✅
2. Enter credentials ✅
3. Redirected to student dashboard ✅
4. Marks table appears with 5 marks ✅
5. Auto-refresh every 10 seconds ✅
6. Can click refresh button ✅

---

## Do This Now

1. [ ] Open Terminal 1
2. [ ] `cd server && node server.js`
3. [ ] Wait for "Server running on port 5000"
4. [ ] Open Terminal 2
5. [ ] `cd client && npm start`
6. [ ] Wait for "Local: http://localhost:5173/"
7. [ ] Open browser to http://localhost:5173
8. [ ] Login with students / test123
9. [ ] Verify marks appear
10. [ ] Open F12 console and check for errors

**Report back what you see!**
