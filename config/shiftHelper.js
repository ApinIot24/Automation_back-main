export function getTodayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function getShiftDataToday(model, jamList, options = {}) {
  const { start, end } = getTodayRange();
  const graph = options.graph ?? "Y";

  const data = await model.findMany({
    where: {
      graph,
      tanggal: { gte: start, lte: end },
      jam: { in: jamList },
    },
    select: { id: true, counter: true, jam: true },
    orderBy: { id: "asc" },
  });

  return data.map((r) => ({
    ...r,
    id: typeof r.id === "bigint" ? Number(r.id) : r.id,
    counter: typeof r.counter === "bigint" ? Number(r.counter) : r.counter,
  }));
}

export async function getShiftDataForDate(model, jamList, date, graph = "Y") {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return await model.findMany({
    where: {
      graph,
      tanggal: { gte: start, lte: end },
      jam: { in: jamList }
    },
    select: { id: true, counter: true, jam: true },
    orderBy: { id: "asc" }
  });
}