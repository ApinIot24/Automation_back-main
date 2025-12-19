import nodemailer from 'nodemailer'
import { PM_EMAIL_CHANNEL, PM_EMAIL_MAP } from '../config/pmEmailMap.js'
import xlsx from 'xlsx'

// Konfigurasi nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "cahyospprt@gmail.com", // email pengirim
        pass: "xkwojxzaccrorerw", // App password Gmail, bukan password biasa
    },
})

// services/emailTemplate.js
function renderPMTable(rows) {
  if (!rows || rows.length === 0) {
    return `<p>Tidak ada data PM.</p>`
  }

  return `
    <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse:collapse; font-size:12px">
      <thead style="background:#f4f4f4">
        <tr>
          <th>ID</th>
          <th>No</th>
          <th>Machine</th>
          <th>Equipment</th>
          <th>Qty</th>
          <th>Periode</th>
          <th>Grup</th>
          <th>Kode Barang</th>
          <th>Periode Start</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            <td>${r.id}</td>
            <td>${r.no}</td>
            <td>${r.machine_name ?? "-"}</td>
            <td>${r.equipment ?? "-"}</td>
            <td>${r.qty ?? "-"}</td>
            <td>${r.periode ?? "-"}</td>
            <td>${r.grup ?? "-"}</td>
            <td>${r.kode_barang ?? "-"}</td>
            <td>${r.periode_start ?? "-"}</td>
            <td style="text-align:center">
              ${r.status === 0 ? "❌" : r.status === 1 ? "⏳" : "✅"}
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `
}

function renderSummary(label, rows) {
  const done = rows.filter((r) => r.status === 2).length
  const pending = rows.filter((r) => r.status === 1).length
  const notDone = rows.filter((r) => r.status === 0).length

  return `
    <p>
      <b>${label}</b> →
      ✅ ${done} |
      ⏳ ${pending} |
      ❌ ${notDone}
    </p>
  `
}

function generateExcelBuffer(rows) {
  const sheet = xlsx.utils.json_to_sheet(rows)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, sheet, "PM")

  return xlsx.write(wb, {
    bookType: "xlsx",
    type: "buffer",
  })
}

export async function sendEmailByJenisPMRange(jenis, rows, weeksRange) {
  const channel = PM_EMAIL_CHANNEL[jenis] ?? jenis;
  const recipients = PM_EMAIL_MAP[channel];

  if (!recipients?.length) {
    console.log(`[EMAIL] No recipient for channel ${channel}`);
    return;
  }

  const rangeLabel = `${weeksRange[0].year}w${weeksRange[0].week} - ${
    weeksRange[weeksRange.length - 1].year
  }w${weeksRange[weeksRange.length - 1].week}`;

  const jenisList = Object.entries(PM_EMAIL_CHANNEL)
    .filter(([_, ch]) => ch === channel)
    .map(([j]) => j);

  const grouped = {};
  for (const j of jenisList) grouped[j] = rows.filter(r => r.jenis_pm === j);

  const summaryHtml = Object.entries(grouped)
    .map(([j, data]) => renderSummary(j.toUpperCase(), data))
    .join("");

  const tableHtml = Object.entries(grouped)
    .map(([j, data]) => `<h3>${j.toUpperCase()}</h3>${renderPMTable(data)}`)
    .join("<br/>");

  const attachments = [];
  for (const [j, data] of Object.entries(grouped)) {
    if (!data.length) continue;
    attachments.push({
      filename: `PM_${j.toUpperCase()}_${rangeLabel}.xlsx`,
      content: generateExcelBuffer(data),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  await transporter.sendMail({
    from: "cahyospprt@gmail.com",
    to: recipients.join(","),
    subject: `PM ${channel.toUpperCase()} - ${rangeLabel} - Weekly Preview`,
    html: `
      <h2>PM ${channel.toUpperCase()} - ${rangeLabel}</h2>
      <p><i>Preview rencana PM 4 minggu ke depan</i></p>
      ${summaryHtml}
      <hr/>
      ${tableHtml}
      <br/>
      <small>Generated automatically by system</small>
    `,
    attachments,
  });

  console.log(`[EMAIL] Sent RANGE channel ${channel}`);
}
// export async function sendEmailByJenisPM(jenis, rows, targetYear, targetWeek) {
//   const channel = PM_EMAIL_CHANNEL[jenis] ?? jenis
//   const recipients = PM_EMAIL_MAP[channel]
//   const weekLabel = `${targetYear}w${targetWeek}`;

//   if (!recipients || recipients.length === 0) {
//     console.log(`[EMAIL] No recipient for channel ${channel}`)
//     return
//   }

//   const jenisList = Object.entries(PM_EMAIL_CHANNEL)
//     .filter(([_, ch]) => ch === channel)
//     .map(([j]) => j)

//   const grouped = {}
//   for (const j of jenisList) {
//     grouped[j] = rows.filter((r) => r.jenis_pm === j)
//   }

//   const summaryHtml = Object.entries(grouped)
//     .map(([j, data]) => renderSummary(j.toUpperCase(), data))
//     .join("")

//   const tableHtml = Object.entries(grouped)
//     .map(
//       ([j, data]) => `
//         <h3>${j.toUpperCase()}</h3>
//         ${renderPMTable(data)}
//       `
//     )
//     .join("<br/>")

//   const attachments = []
//   for (const [j, data] of Object.entries(grouped)) {
//     if (!data.length) continue
//     attachments.push({
//       filename: `PM_${j.toUpperCase()}_${weekLabel}.xlsx`,
//       content: generateExcelBuffer(data),
//       contentType:
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     })
//   }

//   await transporter.sendMail({
//     from: "cahyospprt@gmail.com",
//     to: recipients.join(","),
//     subject: `PM ${channel.toUpperCase()} - ${weekLabel} - Weekly Update`,
//     html: `
//       <h2>PM ${channel.toUpperCase()} - ${weekLabel} - Weekly Update</h2>
//       ${summaryHtml}
//       <hr/>
//       ${tableHtml}
//       <br/>
//       <small>Generated automatically by system</small>
//     `,
//     attachments,
//   })

//   console.log(`[EMAIL] Sent channel ${channel}`)
// }