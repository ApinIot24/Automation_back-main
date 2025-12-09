export function generateWeeklyDataForTargetYear(totalWeeks, period, startPeriod, targetYear) {
  const weekData = {};
  for (let i = 1; i <= totalWeeks; i++) weekData[`w${i}`] = "-";

  if (!period || !startPeriod) return weekData;

  const periods = period.split(",").map(p => p.trim());
  const starts = startPeriod.split(",").map(s => s.trim());
  if (periods.length !== starts.length) return weekData;

  for (let i = 0; i < periods.length; i++) {
    const symbol = (periods[i].match(/^[A-Za-z\/]+/) || ["-"])[0];
    const interval = parseInt(periods[i].match(/\d+/)?.[0] || 0, 10);
    if (!interval) continue;

    const [yearStr, weekStr] = starts[i].split("w");
    let startWeek = parseInt(weekStr, 10);
    let startYear = parseInt(yearStr, 10);

    if (targetYear === startYear) {
      for (let w = startWeek; w <= totalWeeks; w += interval) {
        weekData[`w${w}`] = weekData[`w${w}`] === "-" ? symbol : `${weekData[`w${w}`]},${symbol}`;
      }
      continue;
    }

    if (targetYear < startYear) continue;

    let weeksOriginalYear = getTotalWeeksInYear(startYear);
    let weeksPassed = (weeksOriginalYear - startWeek + 1);

    for (let y = startYear + 1; y < targetYear; y++) {
      weeksPassed += getTotalWeeksInYear(y);
    }

    let rem = weeksPassed % interval;
    let firstWeek = rem === 0 ? 1 : interval - rem + 1;
    firstWeek = Math.max(1, Math.min(firstWeek, totalWeeks));

    for (let w = firstWeek; w <= totalWeeks; w += interval) {
      weekData[`w${w}`] = weekData[`w${w}`] === "-" ? symbol : `${weekData[`w${w}`]},${symbol}`;
    }
  }

  return weekData;
}

export function getTotalWeeksInYear(year) {
  const last = new Date(year, 11, 31);
  const first = new Date(year, 0, 1);
  const d = first.getDay();
  const firstMonday = new Date(year, 0, 1 + (d <= 4 ? -d : 7 - d));
  return Math.floor((last - firstMonday) / (7 * 24 * 60 * 60 * 1000));
}