# Location Sharing Integration with Time Clock

## Feature Overview

Location sharing for technicians has been integrated with the Time Clock feature. Instead of requiring technicians to manually enable location sharing within individual tickets, location sharing now automatically activates when they clock in and deactivates when they clock out.

### Key Changes

| Previous Behavior | New Behavior |
|-------------------|--------------|
| Manual toggle in Ticket View | Automatic on Clock In/Out |
| 1-minute update interval | 15-minute update interval |
| Per-ticket activation | Shift-wide activation |
| No visual status in Time Clock | Status indicator displayed |

---

## Technical Implementation

### Files Modified

1. **`src/components/Tracking/TimeClockView.tsx`**
   - Added GeolocationService integration
   - Location sharing starts on clock-in
   - Location sharing stops on clock-out
   - Auto-resumes if already clocked in on page load
   - Visual status indicator for location sharing

2. **`src/components/Tickets/TechnicianTicketView.tsx`**
   - Updated interval from 1 minute to 15 minutes
   - Added immediate location ping on "Start Work"
   - Maintains manual toggle for edge cases

### Location Update Interval

```
LOCATION_UPDATE_INTERVAL = 15 * 60 * 1000  // 15 minutes (900,000ms)
```

The 15-minute interval was chosen to:
- Reduce battery drain on mobile devices
- Minimize unnecessary database writes
- Provide sufficient tracking granularity for dispatch purposes

### Database Table

Location data is stored in `technician_locations`:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| technician_id | uuid | FK to profiles |
| latitude | numeric | GPS latitude |
| longitude | numeric | GPS longitude |
| accuracy | numeric | GPS accuracy in meters |
| timestamp | timestamptz | When location was captured |
| created_at | timestamptz | Record creation time |

---

## User-Facing Behavior

### For Technicians

#### Clock In Flow
1. Technician clicks "Clock In" button
2. System creates time log entry
3. Browser prompts for location permission (if not already granted)
4. Location sharing starts with immediate first ping
5. Status indicator shows "Location Sharing Active"
6. Updates continue every 15 minutes

#### While Clocked In
- Green status bar shows location is being shared
- Displays "Updates every 15 minutes"
- Shows last update timestamp
- Shows GPS accuracy in meters

#### Start Work on Ticket
- When technician clicks "Start Work" on a ticket
- Immediate location ping is sent (doesn't wait for 15-min interval)
- Provides dispatcher with fresh location when tech arrives on site

#### Clock Out Flow
1. Technician clicks "Clock Out" button
2. System completes time log entry
3. Location sharing stops automatically
4. No further location updates sent

#### Page Refresh / Return
- If technician is already clocked in and returns to Time Clock page
- Location sharing auto-resumes
- No action required from technician

### For Dispatchers

- Technician locations update every 15 minutes while clocked in
- Fresh location sent when technician starts work on a ticket
- "Locate on Map" shows most recent location from database
- No location data when technician is clocked out

---

## Status Indicator States

### Active (Green)
```
[MapPin Icon] Location Sharing Active
Updates every 15 minutes • Last update: 2:30:45 PM
                                        Accuracy: 12m
```

### Starting (Yellow)
```
[MapPinOff Icon] Starting Location Sharing...
Requesting location permission...
```

### Error (Red)
```
[MapPinOff Icon] Location Sharing Error
Location permission denied. Please enable location access in your browser settings.
```

---

## Error Handling

| Error Code | Message | Resolution |
|------------|---------|------------|
| 1 | Permission denied | User must enable location in browser settings |
| 2 | Position unavailable | Check device GPS settings |
| 3 | Timeout | Retry automatically on next interval |
| 0 | Not supported | Browser doesn't support geolocation |

---

## Browser Permissions

Location sharing requires browser permission. The permission prompt appears:
- First time location is requested
- After permissions are reset
- In incognito/private browsing mode

### Resetting Permissions (Chrome)
1. Click the lock icon in address bar
2. Click "Site settings"
3. Find "Location" and change to "Allow"
4. Refresh the page

### Resetting Permissions (Safari)
1. Go to Settings > Safari > Location
2. Find the site and change permission
3. Refresh the page

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Time Clock View                          │
├─────────────────────────────────────────────────────────────────┤
│  Clock In Button                                                │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │ Create Time Log │───►│ Start Location Sharing           │   │
│  │ (Supabase)      │    │ - Get initial position           │   │
│  └─────────────────┘    │ - Save to technician_locations   │   │
│                         │ - Set 15-min interval timer      │   │
│                         └──────────────────────────────────┘   │
│                                      │                          │
│                                      ▼                          │
│                         ┌──────────────────────────────────┐   │
│                         │ Every 15 Minutes:                │   │
│                         │ - getCurrentPosition()           │   │
│                         │ - saveLocation() to Supabase     │   │
│                         │ - Update UI with last location   │   │
│                         └──────────────────────────────────┘   │
│                                                                 │
│  Clock Out Button                                               │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │ Complete Time   │───►│ Stop Location Sharing            │   │
│  │ Log (Supabase)  │    │ - Clear interval timer           │   │
│  └─────────────────┘    │ - Reset state                    │   │
│                         └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Technician Ticket View                       │
├─────────────────────────────────────────────────────────────────┤
│  Start Work Button                                              │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Is Location Sharing Active?                              │   │
│  │   YES: Send immediate ping (sendImmediateLocationPing)   │   │
│  │   NO:  Start location sharing (includes initial ping)    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/services/GeolocationService.ts` | Core geolocation service |
| `src/components/Tracking/TimeClockView.tsx` | Time clock with location integration |
| `src/components/Tickets/TechnicianTicketView.tsx` | Ticket view with Start Work ping |
| `src/components/Dispatch/DispatchMapView.tsx` | Map showing technician locations |

---

## Future Enhancements (Not Yet Implemented)

1. **Dispatcher Ping** - Allow dispatchers to request on-demand location update
2. **Geofencing** - Auto clock-in/out when entering/leaving job site
3. **Location History** - View technician route throughout the day
4. **Configurable Interval** - Admin setting for update frequency
