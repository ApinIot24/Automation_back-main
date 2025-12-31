import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import transporter from "../config/mailer.js";
import { automationDB } from "../src/db/automation.js";

// Constants
const SORT_MAPPING = {
  id: "id",
  category: "category",
  created_at: "created_at",
};

const DEFAULT_SORT = "id";

const EMAIL_RECIPIENTS = [
  "bhilbis123@gmail.com",
  "dwicahyo.1512@gmail.com",
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to retrieve tickets with filters, pagination, and sorting
export const ticket = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sortBy = DEFAULT_SORT,
      sortOrder = "asc",
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.max(1, parseInt(limit));
    const skip = (parsedPage - 1) * parsedLimit;

    // ========================
    // WHERE (FILTER)
    // ========================
    const where = {};

    if (category) {
      where.category = {
        contains: category,
        mode: "insensitive",
      };
    }

    const orderByField = SORT_MAPPING[sortBy] || DEFAULT_SORT;
    const orderBy = {
      [orderByField]: sortOrder.toLowerCase() === "desc" ? "desc" : "asc",
    };

    const [rows, total] = await Promise.all([
      automationDB.history.findMany({
        where,
        orderBy,
        skip,
        take: parsedLimit,
        select: {
          id: true,
          category: true,
          description: true,
          photo_path: true,
          created_at: true,
          status: true,
        },
      }),
      automationDB.history.count({ where }),
    ]);

    const transformedData = rows.map((row) => ({
      id: row.id,
      category: row.category,
      description: row.description,
      photoPath: row.photo_path
        ? `${req.protocol}://${req.get("host")}/api/uploads/${row.photo_path}`
        : null,
      createdAt: row.created_at,
      status: row.status,
    }));

    return res.status(200).json({
      status: "success",
      data: transformedData,
      pagination: {
        currentPage: parsedPage,
        pageSize: parsedLimit,
        totalRecords: total,
        totalPages: Math.ceil(total / parsedLimit),
      },
      filters: {
        category: category || null,
      },
      sorting: {
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      },
    });
  } catch (error) {
    console.error("Error in getTicket:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const createTicket = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.category || !req.body.description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const { category, description } = req.body;
    const photoFilename = req.file.filename;
    const photoUrl = `${req.protocol}://${req.get("host")}/api/uploads/${photoFilename}`;

    // Create ticket
    const created = await automationDB.history.create({
      data: {
        category,
        description,
        photo_path: photoFilename,
        created_at: new Date(),
      },
      select: {
        id: true,
        category: true,
        description: true,
        photo_path: true,
        created_at: true,
      },
    });

    const createdAt = created.created_at instanceof Date
      ? created.created_at
      : new Date(created.created_at);

    const absolutePhotoPath = path.join(__dirname, "../uploads", photoFilename);
    const attachments = fs.existsSync(absolutePhotoPath)
      ? [
          {
            filename: photoFilename,
            path: absolutePhotoPath,
            cid: 'ticketPhoto' // Content ID for embedding in email
          },
        ]
      : [];

    // Modern email template with embedded image
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Ticket Submission</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      🎫 New Ticket Submitted
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    
                    <!-- Alert Badge -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 30px; border-radius: 6px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                        ⚠️ A new support ticket requires your attention
                      </p>
                    </div>
                    
                    <!-- Ticket Details -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 13px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Ticket ID</p>
                          <p style="margin: 8px 0 0 0; font-size: 16px; color: #111827; font-weight: 600;">#${created.id}</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 13px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Category</p>
                          <p style="margin: 8px 0 0 0;">
                            <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                              ${category}
                            </span>
                          </p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 13px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Description</p>
                          <p style="margin: 8px 0 0 0; font-size: 15px; color: #374151; line-height: 1.6;">${description}</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                          <p style="margin: 0; font-size: 13px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Submitted At</p>
                          <p style="margin: 8px 0 0 0; font-size: 15px; color: #374151;">
                            ${createdAt.toLocaleString('en-US', { 
                              dateStyle: 'full', 
                              timeStyle: 'short' 
                            })}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    ${attachments.length > 0 ? `
                    <!-- Attached Image -->
                    <div style="margin-top: 30px;">
                      <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Attached Image</p>
                      <div style="border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #f9fafb;">
                        <img src="cid:ticketPhoto" alt="Ticket Photo" style="width: 100%; height: auto; display: block; max-height: 400px; object-fit: contain;" />
                      </div>
                      <p style="margin: 12px 0 0 0; text-align: center;">
                        <a href="${photoUrl}" target="_blank" style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: 500;">
                          📎 View Full Size Image →
                        </a>
                      </p>
                    </div>
                    ` : ''}
                    
                    <!-- Action Button -->
                    <div style="margin-top: 40px; text-align: center;">
                      <a href="${photoUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #9dc32dff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                        View Ticket Details
                      </a>
                    </div>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 13px; color: #ff0000ff; text-align: center; line-height: 1.6;">
                      This is an automated notification from your ticketing system.<br>
                      Please do not reply to this email.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = {
      from: {
        name: 'Support Ticket System',
        address: 'cahyospprt@gmail.com'
      },
      to: EMAIL_RECIPIENTS.join(","),
      subject: `🎫 New Ticket #${created.id} - ${category.toUpperCase()}`,
      html: emailHTML,
      attachments: attachments
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", info.messageId);
    } catch (err) {
      console.error("❌ Email send failed:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      data: {
        id: created.id,
        category: created.category,
        description: created.description,
        photoPath: created.photo_path,
        createdAt: created.created_at,
      },
    });
  } catch (error) {
    console.error("Error submitting form:", error);

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size should be less than 5MB",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const ticket = await automationDB.history.findUnique({
      where: { id: Number(id) },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const updated = await automationDB.history.update({
      where: { id: Number(id) },
      data: {
        status,
        updated_at: new Date(),
      },
      select: {
        id: true,
        status: true,
        updated_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the ticket",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const deleteTicket = async (req, res) => {
  const { id } = req.params;

  try {
    // Check ticket existence
    const ticket = await automationDB.history.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        photo_path: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Delete DB record
    const deleted = await automationDB.history.delete({
      where: { id: Number(id) },
      select: {
        id: true,
        photo_path: true,
      },
    });

    // Delete image file if exists
    if (deleted.photo_path) {
      const filePath = path.join(
        __dirname,
        "../uploads",
        deleted.photo_path
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the ticket",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const serveUpload = (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  return res.sendFile(filePath);
};


export default { ticket, updateTicket };
