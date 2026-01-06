import nodemailer from 'nodemailer'
import { PM_EMAIL_CHANNEL, PM_EMAIL_MAP } from '../config/pmEmailMap.js'
import { automationDB } from '../src/db/automation.js'
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
function normalizeTargetWeek(r) {
  const twRaw = r.target_week ?? "";
  const twDigits = String(twRaw).match(/\d+/)?.[0];
  return twDigits ?? "-";
}

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
          <th>Target Year</th>
          <th>Target</th>
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
            <td>${r.target_year ?? "-"}</td>
            <td>Minggu ${normalizeTargetWeek(r)}</td>
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
  try {
    const channel = PM_EMAIL_CHANNEL[jenis] ?? jenis;
    const recipients = PM_EMAIL_MAP[channel];

    if (!recipients?.length) {
      console.log(`[EMAIL] No recipient for channel ${channel}`);
      return;
    }

    const rangeLabel = `${weeksRange[0].year}w${weeksRange[0].week} - ${
      weeksRange[weeksRange.length - 1].year
    }w${weeksRange[weeksRange.length - 1].week}`;

    // Dapatkan semua jenis PM yang menggunakan channel yang sama
    const jenisList = Object.entries(PM_EMAIL_CHANNEL)
      .filter(([_, ch]) => ch === channel)
      .map(([j]) => j);

    console.log(`[EMAIL] Channel ${channel} includes jenis: ${jenisList.join(", ")}`);

    // PERBAIKAN: Fetch semua data untuk jenis PM yang share channel yang sama
    const or = weeksRange.map(w => ({
      target_week: String(w.week),
      target_year: String(w.year),
    }));

    // Fetch data dari database untuk semua jenis PM dalam channel ini
    const allRows = await automationDB.replacement_pm.findMany({
      where: {
        jenis_pm: {
          in: jenisList, // Ambil semua jenis yang di channel ini
        },
        OR: or,
      },
      orderBy: [
        { jenis_pm: "asc" },
        { target_year: "asc" },
        { target_week: "asc" },
      ],
    });

    console.log(`[EMAIL] Found ${allRows.length} total rows for channel ${channel}`);

    // Group berdasarkan jenis_pm
    const grouped = {};
    for (const j of jenisList) {
      grouped[j] = allRows.filter(r => r.jenis_pm === j);
      console.log(`[EMAIL] ${j}: ${grouped[j].length} rows`);
    }

    // Cek apakah ada data
    const totalData = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    if (totalData === 0) {
      console.log(`[EMAIL] No data for channel ${channel}, skipping email`);
      return;
    }

    // Generate summary HTML
    const summaryHtml = Object.entries(grouped)
      .filter(([_, data]) => data.length > 0) // Hanya yang ada datanya
      .map(([j, data]) => renderSummary(j.toUpperCase(), data))
      .join("");

    // Generate table HTML
    const tableHtml = Object.entries(grouped)
      .filter(([_, data]) => data.length > 0) // Hanya yang ada datanya
      .map(([j, data]) => `<h3>${j.toUpperCase()}</h3>${renderPMTable(data)}`)
      .join("<br/>");

    // Generate Excel attachments
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

    // Kirim email
    await transporter.sendMail({
      from: "cahyospprt@gmail.com",
      to: recipients.join(","),
      subject: `PM ${channel.toUpperCase()} - ${rangeLabel} - Weekly Preview`,
      html: `
        <h2>PM ${channel.toUpperCase()} - ${rangeLabel}</h2>
        <p><i>Preview rencana PM 4 minggu ke depan</i></p>
        <p><b>Jenis PM dalam email ini:</b> ${jenisList.map(j => j.toUpperCase()).join(", ")}</p>
        ${summaryHtml}
        <hr/>
        ${tableHtml}
        <br/>
        <small>Generated automatically by system</small>
      `,
      attachments,
    });

    console.log(`[EMAIL] ✓ Sent to channel ${channel} (${jenisList.join(", ")}) - ${recipients.length} recipients`);
  } catch (err) {
    console.error(`[EMAIL] Error sending email for ${jenis}:`, err);
    throw err; // Re-throw agar cron tahu ada error
  }
}