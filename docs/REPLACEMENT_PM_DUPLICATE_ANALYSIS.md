# Analisis Detail: Apakah Replacement PM Akan Membuat Insert Duplikat?

## 📊 Skenario: Replacement Per 4 Week (R4W)

### Contoh Data PM:
- `periode = "R4W"` (replacement setiap 4 minggu)
- `periode_start = "2025w1"` (mulai dari week 1 tahun 2025)
- `machine_name = "Machine A"`
- `grup = "grup1"`

### Pattern Replacement:
Dari `periode_start = "2025w1"` dengan interval 4:
- Week 1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53 (tahun 2025)
- Week 1, 5, 9, 13, ... (tahun 2026, jika ada start di tahun 2026)

---

## 🔄 Alur Cron Job Setiap Minggu

### Week 1 Tahun 2025 (Jumat pertama)
```javascript
getLastWeekRolling4(5) → [2, 3, 4, 5, 6]
targetWeek = 6
targetYear = 2025

isReplacementAtTargetWeek("R4W", "2025w1", 6, 2025)
→ Pattern: 1, 5, 9, 13...
→ Week 6 TIDAK match → SKIP (tidak insert)
```

### Week 2 Tahun 2025
```javascript
getLastWeekRolling4(5) → [3, 4, 5, 6, 7]
targetWeek = 7
targetYear = 2025

isReplacementAtTargetWeek("R4W", "2025w1", 7, 2025)
→ Week 7 TIDAK match → SKIP
```

### Week 3 Tahun 2025
```javascript
getLastWeekRolling4(5) → [4, 5, 6, 7, 8]
targetWeek = 8
targetYear = 2025

isReplacementAtTargetWeek("R4W", "2025w1", 8, 2025)
→ Week 8 TIDAK match → SKIP
```

### Week 4 Tahun 2025
```javascript
getLastWeekRolling4(5) → [5, 6, 7, 8, 9]
targetWeek = 9
targetYear = 2025

isReplacementAtTargetWeek("R4W", "2025w1", 9, 2025)
→ Pattern: 1, 5, 9, 13...
→ Week 9 MATCH! ✅
→ Check duplicate: belum ada
→ INSERT untuk week 9 tahun 2025 ✅
```

### Week 5 Tahun 2025 ⚠️ POTENSI DUPLIKAT
```javascript
getLastWeekRolling4(5) → [6, 7, 8, 9, 10]
targetWeek = 10
targetYear = 2025

isReplacementAtTargetWeek("R4W", "2025w1", 10, 2025)
→ Pattern: 1, 5, 9, 13...
→ Week 10 TIDAK match → SKIP
```

**TAPI**, jika cron job berjalan di week 5, dan week 5 sendiri adalah bagian dari pattern:
- Week 5 adalah start week atau match dengan pattern
- Apakah akan insert untuk week 5?

**JAWABAN**: TIDAK, karena:
- Target week adalah **5 minggu ke depan** dari week saat ini
- Jika sekarang week 5, target = week 10 (bukan week 5)
- Week 5 sudah di-insert di week 1 (jika ada start di week 5) atau tidak akan di-insert karena target selalu 5 minggu ke depan

---

## 🔍 Skenario Duplikat yang Mungkin Terjadi

### Skenario 1: Multiple Start Points
Jika `periode_start = "2025w1,2025w5"`:
- Week 1: target = 6 → tidak match
- Week 2: target = 7 → tidak match
- Week 3: target = 8 → tidak match
- Week 4: target = 9 → match dengan start 2025w1 → INSERT week 9
- Week 5: target = 10 → tidak match
- Week 9: target = 14 → tidak match
- Week 13: target = 18 → tidak match
- Week 17: target = 22 → tidak match
- Week 21: target = 26 → tidak match
- Week 25: target = 30 → tidak match
- Week 29: target = 34 → tidak match
- Week 33: target = 38 → tidak match
- Week 37: target = 42 → tidak match
- Week 41: target = 46 → tidak match
- Week 45: target = 50 → tidak match
- Week 49: target = 54 → tidak match
- Week 53: target = 58 (tahun 2026) → tidak match

**TIDAK ADA DUPLIKAT** karena target selalu 5 minggu ke depan, tidak pernah sama dengan week saat ini.

### Skenario 2: Cron Job Berjalan 2x dalam Seminggu
Jika cron job berjalan 2x dalam seminggu yang sama (misal karena restart server):
- Week 4, Jumat pertama: target = 9 → INSERT week 9
- Week 4, Jumat kedua: target = 9 → Check duplicate → SKIP ✅

**DILINDUNGI** oleh check duplicate yang sudah ditambahkan.

### Skenario 3: Manual Test dengan Week yang Sama
Jika test API dipanggil dengan `target_week=5` dan `target_year=2025`:
- Test pertama: INSERT week 5
- Test kedua: Check duplicate → SKIP ✅

**DILINDUNGI** oleh check duplicate.

---

## ✅ Kesimpulan Detail

### Apakah Akan Insert Duplikat?

**TIDAK**, dengan alasan:

1. **Target Week Selalu 5 Minggu Ke Depan**
   - `getLastWeekRolling4(5)` mengambil 5 minggu ke depan dari minggu ini
   - Jika sekarang week 1, target = week 6 (bukan week 1)
   - Jika sekarang week 4, target = week 9 (bukan week 4)
   - **Tidak pernah insert untuk week yang sama dengan week saat ini**

2. **Check Duplicate Sudah Ditambahkan** ✅
   - Sebelum insert, sistem check apakah sudah ada data dengan kombinasi:
     ```javascript
     {
       jenis_pm: "wafer",
       target_week: "9",
       target_year: "2025",
       machine_name: "Machine A",
       grup: "grup1"
     }
     ```
   - Jika sudah ada, akan skip (tidak insert)
   - **Ini mencegah duplikat jika cron job berjalan 2x dalam seminggu yang sama**

3. **Pattern Matching**
   - `isReplacementAtTargetWeek` hanya return `true` jika target week match dengan pattern
   - Tidak akan insert untuk week yang tidak match

### Trace Detail untuk R4W (periode_start = "2025w1")

Pattern: 1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53

| Current Week | Target Week | Match? | Action |
|--------------|-------------|--------|--------|
| Week 1 | Week 6 | ❌ | Skip |
| Week 2 | Week 7 | ❌ | Skip |
| Week 3 | Week 8 | ❌ | Skip |
| Week 4 | Week 9 | ✅ | **INSERT week 9** |
| Week 5 | Week 10 | ❌ | Skip |
| Week 6 | Week 11 | ❌ | Skip |
| Week 7 | Week 12 | ❌ | Skip |
| Week 8 | Week 13 | ✅ | **INSERT week 13** |
| Week 9 | Week 14 | ❌ | Skip |
| Week 10 | Week 15 | ❌ | Skip |
| Week 11 | Week 16 | ❌ | Skip |
| Week 12 | Week 17 | ✅ | **INSERT week 17** |

**Tidak ada duplikat** karena:
- Setiap week yang match hanya di-insert sekali
- Target week selalu berbeda dari current week
- Check duplicate mencegah insert jika sudah ada

### Kapan Duplikat Bisa Terjadi?

Hanya jika:
1. **Manual insert** langsung ke database tanpa melalui job function
2. **Cron job berjalan 2x dalam seminggu yang sama** → **DILINDUNGI oleh check duplicate**
3. **Test API dipanggil berkali-kali dengan week yang sama** → **DILINDUNGI oleh check duplicate**
4. **Data PM diubah** setelah insert (misal `periode_start` diubah dari "2025w1" ke "2025w5")
5. **Bug di logika** `isReplacementAtTargetWeek` yang menyebabkan week yang sama dianggap match berkali-kali

### Rekomendasi

Check duplicate yang sudah ditambahkan **sudah cukup** untuk mencegah duplikat dalam kondisi normal. Namun, untuk extra safety, bisa ditambahkan:

1. **Unique Constraint di Database** (jika memungkinkan)
   ```sql
   CREATE UNIQUE INDEX idx_replacement_pm_unique 
   ON replacement_pm (jenis_pm, target_week, target_year, machine_name, grup);
   ```

2. **Logging** untuk track insert yang di-skip karena duplicate
   ```javascript
   if (exists) {
     console.log(`[SKIP] Duplicate found for ${job.jenis} week ${targetYear}w${targetWeek} - ${row.machine_name}`);
     continue;
   }
   ```

3. **Monitoring** untuk detect anomaly (misal banyak skip karena duplicate)

### Status: ✅ AMAN DARI DUPLIKAT

Dengan check duplicate yang sudah ditambahkan, sistem **tidak akan membuat insert duplikat** untuk replacement per 4 week atau interval lainnya.

