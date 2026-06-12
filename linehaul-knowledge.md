# Linehaul Knowledge

Reference document covering the Jitsu linehaul service, the products built around it, and how they connect.

---

## What Is Linehaul

Linehaul (LH) is the long-haul segment of Jitsu's logistics network. Contracted trucks move sorted parcels between Jitsu sorting hubs on fixed assignments. Each assignment has:

- An **origin** and **destination** hub
- A **driver** and **vehicle**
- A **manifest** (the expected parcel/pallet count, sourced from NetSuite)
- A **delivery window** (scheduled arrival and departure times)
- A **linehaul type** (First Mile, Middle Mile, etc.)

Unlike last-mile delivery, linehaul involves fewer but heavier loads, longer routes, and contracted carriers rather than Jitsu's own gig drivers. Live location data comes from **Project44** (GPS tracking). Financial and manifest data comes from **NetSuite**.

---

## The Three Products

### 1. Linehaul Dispatch — Web

**Who uses it:** Linehaul coordinators at Jitsu hubs.

**What it does:** A live dispatch interface built on top of Jitsu's existing Dispatch platform (same app, linehaul-specific view). Coordinators see all active assignments in real time and can drill into full assignment detail without leaving the board.

**Data sources:**
- **Project44** — live GPS truck positions
- **NetSuite** — manifest, financial, and carrier data

**Layout:**
- **Left panel** — assignment list with persistent filters + live map showing truck positions
- **Detail panel (middle + right)** — opens when an assignment is selected; closes without navigating away

**Filters (always visible, persistent):**
- Injection Date (defaults to current date)
- Origin
- Destination
- Client Name & Client ID
- Linehaul Type
- Status (PO status, separate from LH status)

**Assignment Detail — Middle Column:**
- All stops in sequence (pickup + dropoff) with status indicators: in-progress / success / failed
- Route ETA and estimated distance
- Route status (derived from PO status)
- Schedule section (collapsible): arrival window start, actual arrival timestamp, departure window start, actual delivery timestamp
- Load Info (collapsible): BOL number (PO number), injection date & time, carrier, linehaul type, pallet count, load cost
- Assignment Notes: open-text with user + timestamp on save (mirrors final-mile dispatch notes)
- NOTD Reason Code (collapsible): dropdown with LH late reason codes — Shipper Delay, Weather, Traffic, Vehicle/Mechanical Issues, Carrier Late Arrival, Other — plus open-text notes field
- Driver Info (collapsible): name (may be blank if LH Driver App not completed), phone number, status, JID (Jitsu driver ID — available once LH Driver App ships)
- Vehicle Info (collapsible): Vehicle ID, Trailer ID, Equipment Size

**Assignment Detail — Right Column:**
- History button (linehaul assignment event log)
- Map view (same live map as summary, scoped to this assignment's stops and route)
- Stop info + history button per stop
- Shipment section (for Middle Mile loads): breakout by client name + shipment count; download button generates CSV of shipment ID, client ID, client name associated with the truck — dependent on Middle Mile BOL work
- POD section: BOL proof-of-delivery images submitted by the driver at pickup stop

**Tickets:** INB-851 (left column), INB-852 (middle column), INB-853 (right column)

---

### 2. Warehouse Receiving — Mobile

**Who uses it:** Warehouse workers at destination Jitsu hubs receiving inbound linehaul trucks.

**What it does:** A 5-step receiving flow in the Jitsu warehouse app (Flutter, iOS and Android). Workers log each incoming linehaul delivery — capturing driver arrival, uploading the BOL, counting pallets, signing receipt, and scanning containers.

**The key addition (MOB-1975):** Step 1 (Capture Driver License) was added to record an accurate driver arrival timestamp. Previously the first timestamp captured was the BOL acknowledgement (Step 3–4), which reflected when the worker got to the paperwork — not when the truck arrived on site.

**Receiving Job Flow:**

#### Step 1 — Capture Driver License *(new — MOB-1975)*
- Worker photographs the driver's license
- Timestamp of photo capture = official driver arrival time, stored in the backend with the capturing user's name
- After completion, step header subtitle shows: photo count, capturing username, timestamp

**Exception — Driver Refuses:**
- Worker taps "Driver Refused — capture truck photo instead"
- Navigates to a dedicated truck photo capture screen: take photo → preview → retake or save and continue
- Truck photo + timestamp stored instead of license photo
- Step is marked complete and returns to the stepper
- Fallback link: "I did not capture driver details in time" — marks `driverDetailsNotCaptured: true` on the job

**Step 1 completion condition:** `driverArrivalImages` is non-empty OR `driverDetailsNotCaptured` is true.

#### Step 2 — Upload BOL
- Worker photographs the Bill of Lading (multiple images supported)
- "No BOL Available" option marks a reason on the job
- Step header subtitle shows image count once complete

#### Step 3 — Count Pallets Manually
- Worker enters the pallet count
- Unit toggle: **Pallets** (default) or **Packages** (for floor-loaded trucks)
- Floor-loaded flag disables container mismatch check in Step 5

#### Step 4 — Confirm & Sign Receipt
- Digital signature capture
- Stores: signature image path, signer username, timestamp
- Step header subtitle shows signer name + timestamp on subsequent views

#### Step 5 — Label / Transfer Containers
- Worker scans each inbound container to create a receiving record
- Step header subtitle shows `scanned / expected` count; orange warning if containers still missing
- Damaged containers flagged inline during scan
- **Complete Job** button: enabled when received containers > 0 OR floor-loaded
- **Mismatch dialog**: triggers if final scan count ≠ manual pallet count from Step 3 — captures over count, short count, and a note
- **Save** mid-flow: job is saved and can be resumed later

**Receiving Jobs List:**
- Three tabs: **Ongoing** (in-progress), **Upcoming** (scheduled, from linehaul trip data), **Completed**
- Upcoming tab shows scheduled arrival window and container count per client
- Ongoing tab shows progress bar (containers scanned / expected)
- "Add New Receiving Job" button starts a fresh job

**Key state types:** `CaptureDriverLicenseState`, `UploadBolState`, `CountPalletsState`, `ConfirmSignState`, `LabelTransferState`

**Tickets:** MOB-1975 (FE), MOB-1976 (BE), MOB-1984 (Design)

---

### 3. Linehaul Driver App — Mobile

**Who uses it:** Contracted linehaul drivers.

**Status:** Early development (auth/home/routing scaffold complete; feature modules in progress).

**What it does:** A Flutter mobile app for LH drivers to manage their active assignment from pickup through dropoff and completion.

**Tabs:**
- **Active Assignment** — the primary working tab, covers the full PICKUP → DROPOFF → DONE flow
- **Booking** — assignment booking/scheduling
- **Messenger** — in-app communication channel
- **Profile** — driver profile and settings

**Active Assignment flow (PICKUP phase):**
Confirm Arrival → Upload BOL Instructions → Upload BOL → Pallet Counter → Pallet Notes → (additional pickup steps)

**Active Assignment flow (DROPOFF phase):**
Route Review → Take Receipt Photo → Round Recap → Complete → Mark Ready

**Driver identity:** Once the LH Driver App is live, the JID (Jitsu Driver ID) will be available in the Dispatch assignment detail. Driver name may not always be present in LH data until the app is fully operational.

---

## How the Three Products Connect

```
[Coordinator — Dispatch Web]
  ↓ monitors assignment status, logs NOTD
  ↓ sees live GPS from Project44

[Driver — LH Driver App]
  ↓ picks up load, submits BOL POD at pickup
  ↓ drives to destination hub
  ↓ GPS position tracked via Project44

[Warehouse Worker — Receiving Mobile]
  ↓ Step 1: photographs driver license → arrival timestamp recorded
  ↓ Step 2–5: BOL upload, pallet count, signature, container scan
  ↓ Receiving job linked to linehaul trip ID
```

The **arrival timestamp** captured in the mobile receiving app is the authoritative record of when the truck arrived on site. The **BOL proof of delivery** images submitted by the driver appear in the Dispatch detail panel's POD section. The **linehaul trip ID** links a receiving job back to the specific assignment in the dispatch view.

---

## Key Terms

| Term | Meaning |
|---|---|
| LH | Linehaul |
| BOL | Bill of Lading — the shipment document the driver carries |
| POD | Proof of Delivery — photo evidence submitted at a stop |
| NOTD | Not On Time Delivery — reason code for late assignments |
| JID | Jitsu Driver ID — unique identifier assigned to each driver in the system |
| PO | Purchase Order — the financial record; PO status ≠ LH status |
| Project44 | Third-party GPS tracking provider for linehaul truck positions |
| NetSuite | ERP system; source of manifest, carrier, and financial data |
| Injection Date | The date/time the load is injected into the linehaul network at origin |
| First Mile | LH type for hub-to-hub legs at the start of the delivery chain |
| Middle Mile | LH type for hub-to-hub legs mid-network; involves shipper BOL and CSV shipment exports |
| Floor Loaded | Truck loaded with loose packages instead of palletized containers — changes pallet count unit to "Packages" and disables container mismatch validation |
| Driver Arrival Images | The DL or truck photos captured in Step 1 of receiving, stored as `DriverArrivalImageDto` with `capturedAt` and `capturedByUsername` |
| `driverDetailsNotCaptured` | Boolean flag on `ReceivingJob` set when the worker uses the "I did not capture driver details in time" fallback |
