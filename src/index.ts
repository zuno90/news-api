import express, { Express } from "express"
import dotenv from "dotenv"
dotenv.config({ path: process.env.NODE_ENV === "development" ? ".env.local" : ".env" })
import "reflect-metadata"
import initDatabase from "./utils/initDatabase"
import { ApolloServer } from "apollo-server-express"
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core"
import { buildSchema } from "type-graphql"
import { AuthResolver } from "./graphql/resolvers/auth.resolver"
import { UserResolver } from "./graphql/resolvers/user.resolver"
import { CategoryResolver } from "./graphql/resolvers/category.resolver"
import { PostResolver } from "./graphql/resolvers/post.resolver"
import { FileResolver } from "./graphql/resolvers/file.resolver"

const graphqlUploadExpress = require("graphql-upload/graphqlUploadExpress.js")

const startServer = async () => {
    try {
        await initDatabase() // init DB
        const schema = await buildSchema({
            resolvers: [AuthResolver, UserResolver, CategoryResolver, PostResolver, FileResolver],
            validate: false,
        })

        const server = new ApolloServer({
            schema,
            csrfPrevention: false,
            introspection: true,
            cache: "bounded",
            plugins: [ApolloServerPluginLandingPageLocalDefault],
            context: ({ req, res }) => ({ req, res }),
        })
        await server.start()
        const app: Express = express()
        app.use(graphqlUploadExpress())

        app.use("/public", express.static("src/public")) // change upload -> public path

        server.applyMiddleware({
            app,
            cors: { origin: "*" },
            path: "/gql/v1",
        })

        const PORT = process.env.PORT
        await new Promise<void>(r => app.listen({ port: PORT }, r))
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath} 🚀`)
    } catch (error) {
        console.error(error)
    }
}

startServer()
