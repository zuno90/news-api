import { Arg, Mutation, Resolver, UseMiddleware } from "type-graphql"
import authMiddleware from "../../middlewares/auth.middleware"
import path from "path"
import { FileUpload } from "graphql-upload"
import { FileArrResponse, FileObjectResponse } from "../../response-type/fileUploadResponse"
import { IContext } from "../../global-types/token.type"
import { catchErr } from "../../response-type/errResponse"
import { generatePublicURI, uploadFile } from "../../utils/gg-drive.service"
import { ApolloError } from "apollo-server-express"

const GraphQLUpload = require("graphql-upload/GraphQLUpload.js")

// const pathUpload = path.join(__dirname, "/../../..", "/src/upload/")

@Resolver()
export class FileResolver {
    // Upload to GG Drive - account of ZUNO
    @Mutation(() => FileObjectResponse, { nullable: true })
    @UseMiddleware(authMiddleware)
    async singleUpload(
        @Arg("file", () => GraphQLUpload) file: FileUpload
    ): Promise<FileObjectResponse> {
        try {
            const fileData = await uploadFile(file)
            if (!fileData) throw new ApolloError("Upload failed!")
            const sharedId = await generatePublicURI(fileData.id)
            const thumbUrl = `https://drive.google.com/uc?export=view&id=${sharedId}`
            return {
                success: true,
                msg: "Upload file successfully!",
                data: thumbUrl,
            }
        } catch (error) {
            console.error(error)
            return catchErr()
        }
    }

    // @Query(() => FileArrResponse, { nullable: true })
    // @UseMiddleware(authMiddleware)
    // async getAllFiles(@Ctx() ctx: IContext): Promise<FileArrResponse> {
    //     const { userId } = ctx.req.user
    //     try {
    //         const objData = []
    //         const files = await readdir(pathUpload)
    //         for (const file of files) {
    //             const splitFile = file.split(".")
    //             if (
    //                 splitFile[1] === "png" ||
    //                 splitFile[1] === "jpg" ||
    //                 splitFile[1] === "jpeg" ||
    //                 splitFile[1] === "webp"
    //             ) {
    //                 objData.push({
    //                     name: splitFile[0],
    //                     url: `${process.env.PUBLIC_URL}/${file}`,
    //                 })
    //             }
    //         }
    //         return {
    //             success: true,
    //             msg: "Upload file successfuly!",
    //             data: objData,
    //         }
    //     } catch (error) {
    //         return catchErr()
    //     }
    // }

    // Upload
    // @Mutation(() => FileObjectResponse, { nullable: true })
    // @UseMiddleware(authMiddleware)
    // async singleUpload(
    //     @Arg("file", () => GraphQLUpload) { createReadStream, filename }: FileUpload
    // ): Promise<FileObjectResponse> {
    //     try {
    //         if (!fs.existsSync(pathUpload)) fs.mkdirSync(pathUpload)
    //         createReadStream().pipe(createWriteStream(pathUpload + filename))

    //         const fileUrl = `${process.env.PUBLIC_URL}/${filename}`
    //         return {
    //             success: true,
    //             msg: "Upload file successfully!!!!!",
    //             data: fileUrl,
    //         }
    //     } catch (error) {
    //         return catchErr("Can not upload file... Please try again!")
    //     }
    // }
}
