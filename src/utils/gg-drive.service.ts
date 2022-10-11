import { google } from "googleapis"
import { FileUpload } from "graphql-upload"

const GG_DRIVE_CLIENT = process.env.GG_DRIVE_CLIENT
const GG_DRIVE_SECRET = process.env.GG_DRIVE_SECRET
const GG_DRIVE_REDIRECT_URI = process.env.GG_DRIVE_REDIRECT_URI
const GG_DRIVE_REFRESH_TOKEN = process.env.GG_DRIVE_REFRESH_TOKEN

const oauth2Client = new google.auth.OAuth2(GG_DRIVE_CLIENT, GG_DRIVE_SECRET, GG_DRIVE_REDIRECT_URI)
oauth2Client.setCredentials({ refresh_token: GG_DRIVE_REFRESH_TOKEN })

const driveService = google.drive({ version: "v3", auth: oauth2Client })

export const generatePublicURI = async (fileId: any) => {
    await driveService.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
    })
    return fileId
    // const res = await driveService.files.get({
    //     fileId,
    //     fields: "webViewLink, webContentLink",
    // })
    // return res.data.webViewLink
}

export const uploadFile = async (file: FileUpload) => {
    const res = await driveService.files.create({
        requestBody: { name: file.filename, mimeType: file.mimetype },
        media: { mimeType: "image/*", body: file.createReadStream() },
    })
    return res.data
}

export const deleteFile = async (fileId: string) => await driveService.files.delete({ fileId })
