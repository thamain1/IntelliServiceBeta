# QA Testing Checklist: Location Sharing with Time Clock

**Feature:** Location Sharing Integration with Time Clock
**Version:** 1.0
**Date:** January 2026
**Testing Environment:** Chrome, Safari, Mobile browsers

---

## Pre-Test Setup

- [ ] Ensure test account has technician role
- [ ] Clear any existing browser location permissions for the test site
- [ ] Have access to Supabase dashboard to verify database entries
- [ ] Have a second browser/device to test dispatcher view
- [ ] Note: Tests should be run on a device with GPS capability (or use browser location spoofing)

---

## Test Cases

### TC-001: Clock In Starts Location Sharing

**Preconditions:** User is NOT clocked in, location permissions NOT yet granted

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Time Clock page | "Not Clocked In" card displayed | |
| 2 | Click "Clock In" button | Button shows "Processing..." | |
| 3 | Observe browser prompt | Location permission dialog appears | |
| 4 | Grant location permission | Permission dialog closes | |
| 5 | Observe Time Clock UI | "Currently Clocked In" card appears | |
| 6 | Check location status | Green status bar shows "Location Sharing Active" | |
| 7 | Verify "Updates every 15 minutes" text | Text is displayed below status | |
| 8 | Verify "Last update" timestamp | Shows current time | |
| 9 | Verify accuracy display | Shows accuracy in meters (e.g., "Accuracy: 15m") | |
| 10 | Check Supabase `technician_locations` table | New row with user's location exists | |

**Notes:**
```
Actual last update time: _______________
Actual accuracy: _______________
Database record ID: _______________
```

---

### TC-002: Clock Out Stops Location Sharing

**Preconditions:** User IS clocked in, location sharing is active

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Verify currently clocked in | "Currently Clocked In" card displayed | |
| 2 | Verify location sharing active | Green status bar visible | |
| 3 | Click "Clock Out" button | Button shows "Processing..." | |
| 4 | Observe Time Clock UI | "Not Clocked In" card appears | |
| 5 | Verify location status gone | No location status indicator visible | |
| 6 | Wait 15+ minutes | No new location entries in database | |

**Notes:**
```
Time clocked out: _______________
Last location entry timestamp: _______________
```

---

### TC-003: Auto-Resume on Page Refresh

**Preconditions:** User IS clocked in

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Clock in (if not already) | "Currently Clocked In" displayed | |
| 2 | Verify location sharing active | Green status bar visible | |
| 3 | Refresh the browser page (F5) | Page reloads | |
| 4 | Wait for page to fully load | Time Clock UI appears | |
| 5 | Check clocked in status | "Currently Clocked In" displayed | |
| 6 | Check location sharing | Green status bar shows "Location Sharing Active" | |

**Notes:**
```
Did location sharing resume automatically? Y/N: _______________
```

---

### TC-004: Auto-Resume on Navigation Away and Back

**Preconditions:** User IS clocked in

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Start from Time Clock, clocked in | Location sharing active | |
| 2 | Navigate to another page (e.g., Tickets) | Different page loads | |
| 3 | Navigate back to Time Clock | Time Clock page loads | |
| 4 | Check location sharing status | Green status bar shows "Location Sharing Active" | |

---

### TC-005: Location Permission Denied

**Preconditions:** User is NOT clocked in, location permissions blocked

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Block location in browser settings | Permission set to "Block" | |
| 2 | Navigate to Time Clock page | "Not Clocked In" displayed | |
| 3 | Click "Clock In" button | Clock in succeeds | |
| 4 | Observe location status | Red status bar appears | |
| 5 | Verify error message | Shows "Location permission denied..." | |
| 6 | Verify clock-in still worked | "Currently Clocked In" card visible | |

**Notes:**
```
Error message displayed: _______________
Did clock-in still succeed? Y/N: _______________
```

---

### TC-006: 15-Minute Interval Updates

**Preconditions:** User IS clocked in, location sharing active
**Note:** This is a long-running test. Consider using browser dev tools to verify interval is set correctly as alternative.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Clock in and note initial location time | Time recorded | |
| 2 | Wait 15 minutes | Time passes | |
| 3 | Check "Last update" timestamp | Should show new timestamp ~15 min later | |
| 4 | Check Supabase `technician_locations` | New row added ~15 min after first | |
| 5 | Wait another 15 minutes | Time passes | |
| 6 | Verify another update occurred | Third timestamp in database | |

**Alternative Quick Test:**
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open browser Developer Tools (F12) | DevTools opens | |
| 2 | Go to Console tab | Console visible | |
| 3 | Clock in | Look for console log | |
| 4 | Search for "Location" in console | Should see "[TimeClockView] Location sharing started with 15-minute interval" | |

**Notes:**
```
Initial update time: _______________
Second update time: _______________
Time difference: _______________ (should be ~15 min)
```

---

### TC-007: Immediate Ping on Start Work

**Preconditions:** User IS clocked in with active ticket assigned

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Clock in at Time Clock | Location sharing active | |
| 2 | Note last location timestamp | Time recorded | |
| 3 | Navigate to My Tickets | Ticket list displayed | |
| 4 | Select an assigned ticket | Ticket details shown | |
| 5 | Click "Start Work (Begin Timer)" | Work starts on ticket | |
| 6 | Return to Time Clock page | Check last update timestamp | |
| 7 | Verify timestamp updated | Should show time of Start Work click | |
| 8 | Check Supabase database | New location entry at Start Work time | |

**Notes:**
```
Last update before Start Work: _______________
Last update after Start Work: _______________
Immediate ping sent? Y/N: _______________
```

---

### TC-008: Start Work Without Prior Clock In

**Preconditions:** User is NOT clocked in, has assigned ticket

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Ensure NOT clocked in | "Not Clocked In" on Time Clock | |
| 2 | Navigate to My Tickets | Ticket list displayed | |
| 3 | Select an assigned ticket | Ticket details shown | |
| 4 | Click "Start Work" | Work starts | |
| 5 | Observe location sharing | Should start automatically | |
| 6 | Return to Time Clock | Check if clocked in | |

**Notes:**
```
Did location sharing start from Start Work? Y/N: _______________
Did this also clock the user in? Y/N: _______________
```

---

### TC-009: Multiple Browser Tabs

**Preconditions:** User can open multiple tabs

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open Time Clock in Tab 1 | Time Clock displayed | |
| 2 | Clock in | Location sharing starts | |
| 3 | Open Time Clock in Tab 2 | Time Clock displayed | |
| 4 | Verify Tab 2 shows clocked in | "Currently Clocked In" shown | |
| 5 | Verify Tab 2 shows location active | Green status bar visible | |
| 6 | Clock out in Tab 1 | Clock out succeeds | |
| 7 | Refresh Tab 2 | Page reloads | |
| 8 | Verify Tab 2 shows not clocked in | "Not Clocked In" shown | |

---

### TC-010: Mobile Browser Testing

**Preconditions:** Access to mobile device or mobile emulator

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open app on mobile browser | App loads correctly | |
| 2 | Navigate to Time Clock | Time Clock page displayed | |
| 3 | Clock in | Browser prompts for location | |
| 4 | Grant location permission | Location sharing starts | |
| 5 | Verify status indicator | Green bar visible, fits mobile layout | |
| 6 | Lock phone screen | Screen locks | |
| 7 | Wait 15+ minutes | Time passes | |
| 8 | Unlock and check | Location should have updated (may vary by OS) | |

**Notes:**
```
Mobile browser tested: _______________
OS version: _______________
Background updates worked? Y/N: _______________
```

---

### TC-011: Dispatcher Map View

**Preconditions:** Technician clocked in on Device A, Dispatcher on Device B

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Technician clocks in (Device A) | Location sharing active | |
| 2 | Dispatcher opens Dispatch Map (Device B) | Map loads | |
| 3 | Locate technician on map | Technician marker visible | |
| 4 | Click "Locate on Map" for technician | Map centers on technician | |
| 5 | Verify location is recent | Should match tech's actual location | |
| 6 | Technician clocks out (Device A) | Location sharing stops | |
| 7 | Dispatcher refreshes map (Device B) | Map reloads | |
| 8 | Check technician location | May show last known location or no location | |

---

### TC-012: GPS Accuracy Display

**Preconditions:** User IS clocked in

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Check accuracy display | Shows "Accuracy: Xm" | |
| 2 | Move to location with poor GPS | If possible | |
| 3 | Wait for next update | 15 minutes or Start Work | |
| 4 | Check accuracy again | Should reflect actual GPS accuracy | |

**Notes:**
```
Indoor accuracy: _______________
Outdoor accuracy: _______________
```

---

## Edge Cases

### TC-013: Clock In with No Internet

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Disable internet connection | Offline | |
| 2 | Try to clock in | Should fail gracefully with error message | |
| 3 | Re-enable internet | Online | |
| 4 | Try clock in again | Should succeed | |

---

### TC-014: Location Lost Mid-Shift

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Clock in with location sharing | Active | |
| 2 | Revoke location permission in browser | Permission removed | |
| 3 | Wait for next 15-min update | Update fails | |
| 4 | Check UI | Should show error state | |
| 5 | Grant permission again | Permission restored | |
| 6 | Toggle location sharing off/on | Should resume working | |

---

## Database Verification Queries

Run these queries in Supabase SQL Editor to verify data:

```sql
-- Check recent location updates for a user
SELECT
  tl.id,
  p.full_name,
  tl.latitude,
  tl.longitude,
  tl.accuracy,
  tl.timestamp,
  tl.created_at
FROM technician_locations tl
JOIN profiles p ON p.id = tl.technician_id
WHERE tl.created_at > NOW() - INTERVAL '1 day'
ORDER BY tl.created_at DESC
LIMIT 20;

-- Check time logs to correlate with locations
SELECT
  id,
  user_id,
  clock_in_time,
  clock_out_time,
  status
FROM time_logs
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY clock_in_time DESC;
```

---

## Browser Compatibility Matrix

| Browser | Version | Clock In | Location | Auto-Resume | Pass/Fail |
|---------|---------|----------|----------|-------------|-----------|
| Chrome | Latest | | | | |
| Firefox | Latest | | | | |
| Safari | Latest | | | | |
| Edge | Latest | | | | |
| Chrome Mobile | Latest | | | | |
| Safari Mobile | Latest | | | | |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Tester | | | |
| QA Lead | | | |
| Developer | | | |
| Product Owner | | | |

---

## Defects Found

| ID | Test Case | Description | Severity | Status |
|----|-----------|-------------|----------|--------|
| | | | | |
| | | | | |
| | | | | |

---

## Notes / Observations

```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```
