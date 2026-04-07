# 🔧 TROUBLESHOOTING GUIDE: Student Marks Not Showing

## ✅ What's Been Fixed

The application is a **multi-tenant system** where:
- Each **teacher** has a **class** (with `classSlug`)
- Each **class** has **students**
- Teacher submits marks with **student name** (username)
- Student views marks by their own username

**Verified Working:**
✅ Backend stores marks correctly with student username
✅ Backend API returns marks filtered by student username
✅ Frontend data transformation works correctly
✅ Auto-refresh every 10 seconds is enabled
✅ Manual refresh button is available

---

## 🧪 Step-by-Step Troubleshooting

### 1. **Hard Refresh the Browser**
This clears cached code and forces reload of the latest StudentView component:

**Chrome/Firefox/Edge:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

Or:
- Open DevTools (F12)
- Right-click refresh button → "Empty cache and hard refresh"

### 2. **Open Browser Developer Console (F12)**
Go to: **Console tab**

You should see these logs when student page loads:

```
🚀 StudentView mounted - loading marks
📡 Fetching marks from API...
⏰ Setting up auto-refresh interval (10 seconds)
✅ API Response: [... array of marks ...]
✅ Transformed to 2 test(s)
🔄 Recalculating entries from 2 tests
   → Created 2 entries: [...]
📊 grouped: {...}
📊 months: ["2026-04"]
```

**If you see these logs, then the marks ARE being fetched and processed.**

---

### 3. **Verify Student Username**

Check what student username is being used:

1. Open **DevTools Console**
2. Run this command:
   ```javascript
   localStorage.getItem('ma_current')
   ```

This shows your logged-in student account. Example output:
```json
{
  "id": "69d39e999bb00469fb35c037",
  "username": "students",
  "role": "student",
  "classSlug": "jiet"
}
```

**Important:** The username here MUST exactly match the username the teacher used when submitting marks.

---

### 4. **Check if Marks Exist in Database**

The backend test confirmed marks ARE in the database:
- Student "students" has 2 marks in class "jiet"
- Marks are for subject "maths"
- Dates are April 7, 2026

**If marks show in console logs but not on page**, continue to step 5.

---

### 5. **Click the Refresh Button**

In the Student Dashboard header, you should see:
- A **🔄 Refresh** button (appears after the username)
- Click it to manually refresh marks
- Watch the console logs to see the fetch happen

---

### 6. **Check Network Tab**

1. Open **DevTools → Network tab**
2. Click **Refresh button** or reload page
3. Look for a request to: `/api/tests`
4. Check the response:
   - **Status should be 200**
   - **Response should show an array with your marks**

If you see status **401**, your authentication token expired. Log out and log back in.

---

## 📊 Expected Output When Working

**Console logs (in this order):**
```
🚀 StudentView mounted - loading marks
📡 Fetching marks from API...
✅ API Response: [
  {
    _id: "...",
    studentUsername: "students",
    marks: {maths: {obtained: 80, total: 90}},
    date: "2026-04-07T00:00:00.000Z"
  },
  ...
]
✅ Transformed to 2 test(s)
🔄 Recalculating entries from 2 tests
   → Created 2 entries: [
     {subject: "maths", obtained: 80, total: 90, monthKey: "2026-04"},
     {subject: "maths", obtained: 67, total: 80, monthKey: "2026-04"}
   ]
📊 grouped: {
  "2026-04": [... 2 entries ...]
}
📊 months: ["2026-04"]
```

**Then on the page:**
- Table showing "Your Marks History" 
- Month selector showing "April 2026"
- Two rows:
  - Row 1: Date | maths | 80 | 90
  - Row 2: Date | maths | 67 | 80

---

## ⚠️ Common Issues

### "No marks available yet" message
- Check if teacher actually submitted marks to your username
- Verify your username is in the dropdown list the teacher sees
- Check database directly

### "Loading marks..." (stuck loading)
- Network error - check DevTools Network tab
- Server not running - start server
- Authentication failed - try logging out and back in

### Marks show but don't update after teacher adds new ones
- Auto-refresh runs every 10 seconds
- OR click the 🔄 Refresh button manually

---

## 📞 Share This Info

When reporting the issue, provide:

1. **Student username** (from localStorage as shown in step 3)
2. **Console logs** (screenshot or copy-paste from F12 console)
3. **Network response** (screenshot of /api/tests response in Network tab)

This will help identify exactly where the issue is.
