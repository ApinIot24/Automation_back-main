# Rangkuman Cara Kerja Kirim Email PM Weekly

## 📋 Overview
Sistem ini mengirim email otomatis setiap Jumat jam 1 pagi (WIB) untuk memberikan preview rencana PM (Preventive Maintenance) 4 minggu ke depan.

---

## 🔄 Alur Kerja Lengkap

### 1. **Trigger Cron Job** (`jobs/pmWeekly.cron.js`)
- **Schedule**: `"0 1 * * 5"` (Setiap Jumat jam 01:00 WIB)
- **Timezone**: Asia/Jakarta

### 2. **Tahap 1: Generate Replacement PM Data**

#### 2.1. Menjalankan PM Jobs
Sistem menjalankan 4 job secara berurutan:
- `runWaferPM()` → Generate data untuk jenis "wafer"
- `runBiscuitPM()` → Generate data untuk jenis "biscuit"  
- `runUtilityPM()` → Generate data untuk jenis "utility"
- `runAstorPM()` → Generate data untuk jenis "astor"

#### 2.2. Logika Generate Replacement PM (contoh: `runWaferPM()`)

```javascript
// 1. Hitung target week (5 minggu ke depan dari minggu ini)
const rolling = getLastWeekRolling4(5);
const last = rolling[rolling.length - 1];
const targetWeek = last.week;  // Contoh: week 5
const targetYear = last.year;  // Contoh: 2026

// 2. Ambil semua data PM dari tabel pm_wafer
const rows = await automationDB.pm_wafer.findMany();

// 3. Filter data yang eligible:
for (const row of rows) {
  // 3a. Cek apakah periode mengandung replacement (format: R4W, R8W, dll)
  if (!hasReplacementInPeriode(row.periode)) {
    continue; // Skip jika tidak ada replacement
  }
  
  // 3b. Cek apakah target week sesuai dengan jadwal replacement
  if (!isReplacementAtTargetWeek(
    row.periode,        // Contoh: "R4W" (replacement setiap 4 minggu)
    row.periode_start,  // Contoh: "2025w1" (mulai dari week 1 tahun 2025)
    targetWeek,         // Week yang sedang dihitung (week 5)
    targetYear          // Tahun yang sedang dihitung (2026)
  )) {
    continue; // Skip jika tidak match
  }
  
  // 4. Jika eligible, buat record di tabel replacement_pm
  await automationDB.replacement_pm.create({
    data: {
      ...clean,                    // Semua field dari pm_wafer
      jenis_pm: "wafer",          // Jenis PM
      status: 0,                   // Status: 0 = belum dikerjakan
      target_week: String(targetWeek),  // Week target (contoh: "5")
      target_year: String(targetYear)    // Tahun target (contoh: "2026")
    }
  });
}
```

**Hasil**: Data replacement PM tersimpan di tabel `replacement_pm` dengan:
- `jenis_pm`: "wafer", "biscuit", "utility", atau "astor"
- `target_week` & `target_year`: Week dan tahun kapan replacement harus dilakukan
- `status`: 0 (belum dikerjakan), 1 (pending), 2 (selesai)

---

### 3. **Tahap 2: Pengambilan Data untuk Email**

#### 3.1. Hitung Week Range untuk Email
```javascript
// Ambil 4 minggu ke depan dari minggu ini
const weeks = getEmailWeeksRange(4);
// Contoh hasil: [
//   { week: 1, year: 2026 },
//   { week: 2, year: 2026 },
//   { week: 3, year: 2026 },
//   { week: 4, year: 2026 }
// ]
```

#### 3.2. Query Data Replacement PM
Untuk setiap jenis PM (wafer, biscuit, utility, astor):

```javascript
const rows = await automationDB.replacement_pm.findMany({
  where: {
    jenis_pm: jenis,  // "wafer", "biscuit", "utility", atau "astor"
    OR: [
      { target_week: "1", target_year: "2026" },
      { target_week: "2", target_year: "2026" },
      { target_week: "3", target_year: "2026" },
      { target_week: "4", target_year: "2026" }
    ]
  },
  orderBy: [
    { target_year: "asc" },
    { target_week: "asc" }
  ]
});
```

**Filter**: Hanya ambil data yang `target_week` dan `target_year`-nya ada dalam 4 minggu ke depan.

---

### 4. **Tahap 3: Pengiriman Email**

#### 4.1. Mapping Channel & Recipients
```javascript
// Dari config/pmEmailMap.js
PM_EMAIL_CHANNEL = {
  wafer: "wafer",
  biscuit: "biscuit", 
  utility: "utility",
  astor: "wafer"  // Astor menggunakan channel wafer
}

PM_EMAIL_MAP = {
  wafer: ["email1@mayora.co.id", "email2@mayora.co.id", ...],
  biscuit: ["email1@mayora.co.id", "email2@mayora.co.id", ...],
  utility: ["email1@mayora.co.id", "email2@mayora.co.id", ...]
}
```

#### 4.2. Grouping Data
```javascript
// Group data berdasarkan jenis PM yang menggunakan channel yang sama
// Contoh: wafer dan astor sama-sama menggunakan channel "wafer"
const jenisList = ["wafer", "astor"]; // Jika channel = "wafer"
const grouped = {
  wafer: [...rows dengan jenis_pm = "wafer"],
  astor: [...rows dengan jenis_pm = "astor"]
};
```

#### 4.3. Generate Email Content

**a. Summary (Ringkasan Status)**
```javascript
// Hitung jumlah berdasarkan status:
- ✅ Done (status = 2)
- ⏳ Pending (status = 1)  
- ❌ Not Done (status = 0)
```

**b. HTML Table**
- Menampilkan semua data replacement PM dalam format tabel HTML
- Kolom: ID, No, Machine, Equipment, Qty, Periode, Grup, Kode Barang, Periode Start, Status

**c. Excel Attachment**
- Generate file Excel (.xlsx) untuk setiap jenis PM
- Filename: `PM_WAFER_2026w1-2026w4.xlsx`
- Berisi semua data replacement PM untuk jenis tersebut

#### 4.4. Kirim Email
```javascript
await transporter.sendMail({
  from: "cahyospprt@gmail.com",
  to: recipients.join(","),  // Semua email dari PM_EMAIL_MAP[channel]
  subject: `PM WAFER - 2026w1-2026w4 - Weekly Preview`,
  html: `
    <h2>PM WAFER - 2026w1-2026w4</h2>
    <p><i>Preview rencana PM 4 minggu ke depan</i></p>
    ${summaryHtml}  // Ringkasan status
    <hr/>
    ${tableHtml}    // Tabel data
  `,
  attachments: [
    { filename: "PM_WAFER_2026w1-2026w4.xlsx", content: excelBuffer },
    { filename: "PM_ASTOR_2026w1-2026w4.xlsx", content: excelBuffer }
  ]
});
```

---

## 📊 Diagram Alur

```
┌─────────────────────────────────────────────────────────┐
│  CRON JOB (Jumat 01:00 WIB)                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  TAHAP 1: Generate Replacement PM                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ runWaferPM  │  │runBiscuitPM  │  │runUtilityPM  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┴─────────────────┘           │
│                          │                               │
│         ┌────────────────▼────────────────┐             │
│         │  runAstorPM                      │             │
│         └────────────────┬────────────────┘             │
│                          │                               │
│         ┌────────────────▼────────────────┐             │
│         │  Filter PM dengan replacement   │             │
│         │  periode (R4W, R8W, dll)       │             │
│         └────────────────┬────────────────┘             │
│                          │                               │
│         ┌────────────────▼────────────────┐             │
│         │  Cek apakah match dengan        │             │
│         │  target week (5 minggu depan)   │             │
│         └────────────────┬────────────────┘             │
│                          │                               │
│         ┌────────────────▼────────────────┐             │
│         │  INSERT ke replacement_pm       │             │
│         │  dengan status = 0              │             │
│         └─────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  TAHAP 2: Ambil Data untuk Email                        │
│                                                          │
│  1. Hitung 4 minggu ke depan:                           │
│     getEmailWeeksRange(4)                               │
│     → [{week:1,year:2026}, {week:2,year:2026}, ...]    │
│                                                          │
│  2. Query replacement_pm:                               │
│     WHERE jenis_pm = "wafer"                            │
│     AND (target_week, target_year) IN (4 weeks)        │
│                                                          │
│  3. Lakukan untuk setiap jenis:                         │
│     - wafer                                             │
│     - biscuit                                           │
│     - utility                                            │
│     - astor                                              │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  TAHAP 3: Kirim Email                                   │
│                                                          │
│  1. Mapping Channel:                                    │
│     wafer → channel "wafer"                             │
│     astor → channel "wafer" (sama)                      │
│                                                          │
│  2. Group Data:                                         │
│     grouped = {                                         │
│       wafer: [...],                                      │
│       astor: [...]                                       │
│     }                                                    │
│                                                          │
│  3. Generate Content:                                   │
│     - Summary (✅⏳❌)                                   │
│     - HTML Table                                         │
│     - Excel Files                                        │
│                                                          │
│  4. Kirim ke Recipients:                                │
│     PM_EMAIL_MAP[channel]                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Points

### 1. **Target Week untuk Generate vs Email**
- **Generate Replacement PM**: Menggunakan **5 minggu ke depan** (week terakhir dari `getLastWeekRolling4(5)`)
- **Email**: Menggunakan **4 minggu ke depan** (dari `getEmailWeeksRange(4)`)

**Alasan**: Generate lebih dulu untuk memastikan data sudah ada sebelum email dikirim.

### 2. **Filter Replacement PM**
- Hanya PM dengan **periode replacement** (format: `R4W`, `R8W`, dll) yang di-generate
- Harus **match dengan target week** berdasarkan `periode_start` dan interval

### 3. **Channel Mapping**
- `astor` menggunakan channel yang sama dengan `wafer`
- Email untuk `wafer` dan `astor` akan digabung dalam 1 email

### 4. **Status Replacement PM**
- `status = 0`: Belum dikerjakan (default saat generate)
- `status = 1`: Pending (sedang dikerjakan)
- `status = 2`: Selesai

### 5. **Email Content**
- **Subject**: `PM {CHANNEL} - {WEEK_RANGE} - Weekly Preview`
- **Body**: Summary + HTML Table
- **Attachment**: Excel file per jenis PM

---

## 📝 Contoh Data Flow

**Contoh: Hari ini adalah Week 51 Tahun 2025**

1. **Generate Replacement PM**:
   - Target: Week 3 Tahun 2026 (5 minggu ke depan)
   - Cari PM dengan periode `R4W` yang jadwalnya jatuh di week 3 tahun 2026
   - Insert ke `replacement_pm` dengan `target_week="3"`, `target_year="2026"`

2. **Ambil Data untuk Email**:
   - Week Range: Week 52 (2025), Week 1-3 (2026) → 4 minggu ke depan
   - Query: `WHERE jenis_pm = "wafer" AND (target_week, target_year) IN (52/2025, 1/2026, 2/2026, 3/2026)`

3. **Kirim Email**:
   - Channel: "wafer"
   - Recipients: Semua email di `PM_EMAIL_MAP["wafer"]`
   - Content: Data replacement PM untuk 4 minggu tersebut

---

## 🛠️ Testing

Gunakan endpoint test:
```
GET /api/test/pm_weekly?target_year=2026&target_week=2
```

Ini akan menjalankan semua tahap di atas dengan week/year custom untuk testing.

