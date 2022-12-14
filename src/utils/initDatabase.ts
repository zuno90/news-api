import mongoose from "mongoose"

const initDatabase = async () => {
    try {
        await mongoose.connect(
            `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`,
            { dbName: process.env.DATABASE_NAME }
        )
        console.log("⚡️⚡️⚡️⚡️⚡️ Connect to MONGODB inside docker ⚡️⚡️⚡️⚡️⚡️")
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

export default initDatabase
