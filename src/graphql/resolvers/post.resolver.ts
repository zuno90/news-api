import { Ctx, Arg, Mutation, Query, Resolver, InputType, Field, UseMiddleware } from "type-graphql"
import { PostArrResponse, PostObjectResponse } from "../../response-type/postResponse"
import authMiddleware from "../../middlewares/auth.middleware"
import { Post } from "../../models/post.model"
import { User } from "../../models/user.model"
import { Category } from "../../models/category.model"
import { IContext } from "../../global-types/token.type"
import { catchErr } from "../../response-type/errResponse"
import { ApolloError } from "apollo-server-express"
import { deleteFile } from "../../utils/gg-drive.service"

@InputType()
class CreatePostInput {
    @Field()
    title: string

    @Field(() => String, { nullable: true })
    description?: string

    @Field()
    content: string

    @Field()
    thumbnail: string

    @Field()
    cateId: string
}

@InputType()
class UpdatePostInput {
    @Field()
    _id: string

    @Field()
    title: string

    @Field({ nullable: true })
    description?: string

    @Field()
    content: string

    @Field({ nullable: true })
    thumbnail?: string

    @Field()
    cateId: string
}

@Resolver()
export class PostResolver {
    // Query
    @Query(() => PostArrResponse, { nullable: true })
    // @UseMiddleware(authMiddleware)
    async getAllPosts(@Ctx() ctx: IContext, @Arg("status", { nullable: true }) status: string) {
        // const { userId } = ctx.req.user
        try {
            const posts = await Post.find(status ? { status } : {})
                .populate("category")
                .populate("author")
            return {
                success: true,
                data: posts,
            }
        } catch (error) {
            return catchErr()
        }
    }

    @Query(() => PostObjectResponse, { nullable: true })
    // @UseMiddleware(authMiddleware)
    async getPostById(
        @Ctx() ctx: IContext,
        @Arg("_id") _id: string,
        @Arg("status", { nullable: true }) status: string
    ) {
        // const { userId } = ctx.req.user
        try {
            const post = await Post.findOne(status ? { _id, status } : { _id })
                .populate("category")
                .populate("author")
            return {
                success: true,
                data: post,
            }
        } catch (error) {
            return catchErr()
        }
    }

    @Query(() => PostObjectResponse, { nullable: true })
    // @UseMiddleware(authMiddleware)
    async getPostsByCategoryId(
        @Ctx() ctx: IContext,
        @Arg("cateId") cateId: string,
        @Arg("status", { nullable: true }) status: string
    ) {
        // const { userId } = ctx.req.user
        try {
            const posts = await Post.find(
                status ? { status, category: cateId } : { category: cateId }
            )
            return {
                success: true,
                data: posts,
            }
        } catch (error) {
            return catchErr()
        }
    }

    // Mutation
    @Mutation(() => PostObjectResponse, { nullable: true })
    @UseMiddleware(authMiddleware)
    async createPost(
        @Arg("CreatePostInput")
        { title, description, content, thumbnail, cateId }: CreatePostInput,
        @Ctx() ctx: IContext
    ): Promise<PostObjectResponse> {
        const { userId } = ctx.req.user
        try {
            const existedPost = await Post.findOne({ title })
            if (existedPost)
                throw new ApolloError("Post title is existed... Please input another one!")
            const post = await Post.create({
                title,
                description,
                content,
                thumbnail,
                category: cateId,
                author: userId,
            })
            await Promise.all([
                User.findByIdAndUpdate(userId, { $push: { posts: post } }),
                Category.findByIdAndUpdate(cateId, { $push: { posts: post } }),
            ])
            return {
                success: true,
                msg: "Successfully create a new post!",
                data: post,
            }
        } catch (error: any) {
            console.error(error)
            return catchErr(error.message)
        }
    }

    @Mutation(() => PostObjectResponse, { nullable: true })
    @UseMiddleware(authMiddleware)
    async updatePost(
        @Arg("UpdatePostInput")
        { _id, title, description, content, thumbnail, cateId }: UpdatePostInput,
        @Ctx() ctx: IContext
    ): Promise<PostObjectResponse> {
        const { userId } = ctx.req.user
        try {
            const existedPost = await Post.findOne({ _id })
            if (!existedPost) throw new ApolloError("Post is not available!")
            await Post.updateOne(
                { _id },
                { title, description, content, thumbnail, category: cateId, author: userId }
            )
            return {
                success: true,
                msg: "Successfully Update post!",
            }
        } catch (error: any) {
            console.error(error)
            return catchErr(error.message)
        }
    }

    @Mutation(() => PostObjectResponse, { nullable: true })
    @UseMiddleware(authMiddleware)
    async updateStatusPost(
        @Ctx() ctx: IContext,
        @Arg("_id") _id: string
    ): Promise<PostObjectResponse> {
        const { userId } = ctx.req.user
        try {
            const existedPost = await Post.findOne({ _id })
            if (!existedPost) throw new ApolloError("Post is not available!")
            await Post.findOneAndUpdate(
                { _id },
                { status: existedPost.status === "Active" ? "Inactive" : "Active" },
                { new: true }
            )
            return {
                success: true,
                msg: "Successfully Change Post Status!",
            }
        } catch (error: any) {
            console.error(error)
            return catchErr(error.message)
        }
    }

    @Mutation(() => PostObjectResponse, { nullable: true })
    @UseMiddleware(authMiddleware)
    async removePost(@Ctx() ctx: IContext, @Arg("_id") _id: string): Promise<PostObjectResponse> {
        const { userId } = ctx.req.user
        try {
            const existedPost = await Post.findOne({ _id })
            if (!existedPost) throw new ApolloError("Post is not available!")
            const thumbnailId = existedPost.thumbnail.split("&id=")[1]

            const removeFromUser = User.findOneAndUpdate({ $pull: { posts: _id } }).select(
                "-password"
            ) // remove cate to array of user owned
            const removefromCategory = Category.findOneAndUpdate({ $pull: { posts: _id } }) // delete id of category
            const removePost = Post.deleteOne({ _id }) // delete post

            await Promise.all([
                deleteFile(thumbnailId),
                removeFromUser,
                removefromCategory,
                removePost,
            ])
            return {
                success: true,
                msg: "Successfully Delete post!",
            }
        } catch (error: any) {
            console.error(error)
            return catchErr(error.message)
        }
    }
}
