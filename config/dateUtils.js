export function generateWeeklyDataForTargetYear(
  totalWeeks,
  period,
  startPeriod,
  targetYear
) {
  const weekData = {};
  // Inisialisasi semua minggu di tahun target dengan default "-"
  for (let i = 1; i <= totalWeeks; i++) {
    weekData[`w${i}`] = "-";
  }

  // Validasi period dan startPeriod
  if (
    !period ||
    typeof period !== "string" ||
    !startPeriod ||
    typeof startPeriod !== "string"
  ) {
    return weekData;
  }

  const periods = period.split(",").map((p) => p.trim());
  const startPeriods = startPeriod.split(",").map((s) => s.trim());

  if (periods.length !== startPeriods.length) {
    return weekData;
  }

  // Proses setiap periode
  for (let idx = 0; idx < periods.length; idx++) {
    const currentPeriod = periods[idx];
    const currentStartPeriod = startPeriods[idx];

    // Ekstrak simbol dan interval dari currentPeriod
    const symbolMatch = currentPeriod.match(/^[A-Za-z\/]+/);
    const symbol = symbolMatch ? symbolMatch[0] : "-";
    const intervalMatch = currentPeriod.match(/\d+/);
    const interval = intervalMatch ? parseInt(intervalMatch[0], 10) : null;

    if (!interval) continue;

    // console.log(`Period: ${currentPeriod}`);
    // console.log(`Symbol: ${symbol}, Interval: ${interval}`);

    // Ekstrak tahun dan minggu awal dari currentStartPeriod
    const [startYear, startWeekString] = currentStartPeriod.split("w");
    let startWeek = parseInt(startWeekString?.trim(), 10);
    let originalYear = parseInt(startYear, 10);

    if (isNaN(startWeek) || isNaN(originalYear)) continue;

    // console.log(`Start Period: ${currentStartPeriod}`);
    // console.log(`Start Year: ${startYear}, Start Week: ${startWeek}`);

    // Jika kita menghasilkan data untuk tahun awal, cukup isi minggu dari minggu awal
    if (targetYear === originalYear) {
      // console.log(
      //   `Tahun target sama dengan tahun awal. Mulai dari minggu ${startWeek}`
      // );
      for (let i = startWeek; i <= totalWeeks; i += interval) {
        // console.log(`Mengisi minggu: ${i} dengan simbol: ${symbol}`);
        weekData[`w${i}`] =
          weekData[`w${i}`] === "-" ? symbol : `${weekData[`w${i}`]},${symbol}`;
      }
      continue;
    }

    // Jika targetYear sebelum tahun awal, tidak ada entri untuk diisi
    if (targetYear < originalYear) {
      // console.log(
      //   `Tahun target sebelum tahun awal. Tidak ada entri untuk diisi.`
      // );
      continue;
    }

    // Hitung minggu mana di tahun target yang harus diisi berdasarkan pola
    // Pertama, hitung total minggu dari tanggal mulai hingga akhir tahun awal
    let weeksInOriginalYear = getTotalWeeksInYear(originalYear);
    let weeksFromStartToEndOfOriginalYear = weeksInOriginalYear - startWeek + 1;

    // console.log(
    //   `Minggu dari awal hingga akhir tahun awal: ${weeksFromStartToEndOfOriginalYear}`
    // );

    // Hitung total minggu di antara tahun awal dan tahun target
    let totalWeeksInBetween = 0;
    for (let year = originalYear + 1; year < targetYear; year++) {
      totalWeeksInBetween += getTotalWeeksInYear(year);
    }

    // console.log(`Total minggu di tahun-tahun antara: ${totalWeeksInBetween}`);

    // Total jumlah minggu dari tanggal mulai hingga awal tahun target
    let totalWeeksPassed =
      weeksFromStartToEndOfOriginalYear + totalWeeksInBetween;
    // console.log(
    //   `Total minggu yang berlalu sejak awal pola: ${totalWeeksPassed}`
    // );

    // Hitung minggu pertama di tahun target di mana pola harus muncul
    let remainder = totalWeeksPassed % interval;
    let firstWeekInTargetYear;

    if (remainder === 0) {
      // Jika sisa adalah 0, minggu pertama harus minggu pertama
      firstWeekInTargetYear = 1;
    } else {
      // Jika tidak, minggu pertama adalah (interval - remainder + 1)
      firstWeekInTargetYear = interval - remainder + 1;
    }

    // Pastikan minggu pertama berada dalam rentang yang valid
    firstWeekInTargetYear = Math.max(
      1,
      Math.min(firstWeekInTargetYear, totalWeeks)
    );

    // console.log(
    //   `Kemunculan pertama di tahun target pada minggu: ${firstWeekInTargetYear}`
    // );

    // Isi minggu di tahun target berdasarkan pola
    for (let i = firstWeekInTargetYear; i <= totalWeeks; i += interval) {
      // console.log(`Mengisi minggu: ${i} dengan simbol: ${symbol}`);
      weekData[`w${i}`] =
        weekData[`w${i}`] === "-" ? symbol : `${weekData[`w${i}`]},${symbol}`;
    }
  }

  return weekData;
}

export function getTotalWeeksInYear(year) {
  const lastDay = new Date(year, 11, 31);
  const firstDayOfYear = new Date(year, 0, 1);
  const dayOfWeek = firstDayOfYear.getDay();
  const firstMonday = new Date(
    year,
    0,
    1 + (dayOfWeek <= 4 ? -dayOfWeek : 7 - dayOfWeek)
  );
  return Math.floor((lastDay - firstMonday) / (7 * 24 * 60 * 60 * 1000));
}

export function format(date) {
    if (!(date instanceof Date)) {
        throw new Error('Invalid "date" argument. You must pass a date instance');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function getMonthWeek(year, month, week) {
    // Set date to 4th of month
    let d = new Date(year, month - 1, 4);
    // Get day number, set Sunday to 7
    let day = d.getDay() || 7;
    // Set to prior Monday
    d.setDate(d.getDate() - day + 1);
    // Set to required week
    d.setDate(d.getDate() + 7 * (week - 1));
    return d;
}
export function getWeek(date) {
    let monthStart = new Date(date);
    monthStart.setDate(0);
    let offset = (monthStart.getDay() + 1) % 7 - 1; // -1 is for a week starting on Monday
    return Math.ceil((date.getDate() + offset) / 7);
}
// Return array of dates for specified week of month of year
export function getWeekDates(year, month, week) {
    let d = getMonthWeek(year, month, week);
    for (var i = 0, arr = []; i < 7; i++) {

        // Array of date strings
        arr.push(d.toLocaleDateString());

        // For array of Date objects, replace above with
        // arr.push(new Date(d));

        // Increment date
        d.setDate(d.getDate() + 1);
    }
    return arr;
}