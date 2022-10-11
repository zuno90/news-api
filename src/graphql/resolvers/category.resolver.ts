import {
    Ctx,
    Arg,
    Mutation,
    Query,
    Resolver,
    InputType,
    Field,
    ID,
    UseMiddleware,
} from "type-graphql"
import { CategoryArrResponse, CategoryObjectResponse } from "../../response-type/categoryResponse"
import authMiddleware from "../../middlewares/auth.middleware"
import { Category } from "../../models/category.model"
import { User } from "../../models/user.model"
import { Post } from "../../models/post.model"
import { ObjectId } from "mongoose"
import { IContext } from "../../global-types/token.type"
import { catchErr } from "../../response-type/errResponse"
import { ApolloError } from "apollo-server-express"

@InputType()
class CreateCategoryInput {
    @Field()
    title: string

    @Field()
    description: string
}

@InputType()
class UpdateCategoryInput {
    @Field(() => ID)
    _id: ObjectId

    @Field()
    title: string

    @Field()
    description: string
}

@Resolver()
export class CategoryResolver {
    // Query
    @Query(() => CategoryArrResponse, { nullable: true })
    // @UseMiddleware(authMiddleware)
    async getAllCategories(
        @Ctx() ctx: IContext,
        @Arg("status", { nullable: true }) status: string
    ) {
        // const { userId } = ctx.req.user
        try {
            const categories = await Category.find(status ? { status } : {})
                .populate("posts")
                .populate("author")
            return {
                success: true,
                data: categories,
            }
        } catch (error) {
            return catchErr()
        }
    }

    @Query(() => CategoryObjectResponse, { nullable: true })
    // @UseMiddleware(authMiddleware)
    async getCategoryById(
        @Ctx() ctx: IContext,
        @Arg("_id") _id: string,
        @Arg("status") status?: string
    ) {
        // const { userId } = ctx.req.user
        try {
            const category = await Category.findOne(status ? { _id, status } : { _id })
                .populate("posts")
                .populate("author")

            return {
                success: true,
                msg: "Successfully Create category",
                data: category,
            }
        } catch (error) {
            return catchErr()
        }
    }

    // Mutation
    @Mutation(() => CategoryObjectResponse, { nullable: true }) // create
    @UseMiddleware(authMiddleware)
    async createCategory(
        @Arg("CreateCategoryInput")
        { title, description }: CreateCategoryInput,
        @Ctx() ctx: IContext
    ): Promise<CategoryObjectResponse> {
        const { userId } = ctx.req.user
        try {
            const existedCategory = await Category.findOne({ title, author: userId })
            if (existedCategory)
                throw new ApolloError("Category title is existing... Please input another one!")

            const category = await Category.create({ title, description, author: userId })
            await User.findByIdAndUpdate(userId, { $push: { categories: category } }) // add category to array of user owned
            return {
                success: true,
                msg: "Successfully create a new category!",
                data: category,
            }
        } catch (error: any) {
            return catchErr(error.message)
        }
    }

    @Mutation(() => CategoryObjectResponse, { nullable: true }) // update
    @UseMiddleware(authMiddleware)
    async updateCategory(
        @Arg("UpdateCategoryInput")
        { _id, title, description }: UpdateCategoryInput,
        @Ctx() ctx: IContext
    ): Promise<CategoryObjectResponse> {
        const { userId } = ctx.req.user
        try {
            const category = await Category.findOneAndUpdate(
                { _id },
                { title, description },
                { new: true }
            )
            return {
                success: true,
                msg: "Successfully update category!",
                data: category,
            }
        } catch (error) {
            return catchErr()
        }
    }

    @Mutation(() => CategoryObjectResponse, { nullable: true }) // update status
    @UseMiddleware(authMiddleware)
    async updateStatusCategory(
        @Arg("_id") _id: string,
        @Ctx() ctx: IContext
    ): Promise<CategoryObjectResponse> {
        const { userId } = ctx.req.user
        try {
            const category = await Category.findOne({ _id })
            if(!category) throw new ApolloError("Category is not available!")
            const newCategory = await Category.findOneAndUpdate(
                { _id },
                { status: category.status === "Active" ? "Inactive" : "Active" },
                { new: true }
            )
            await Post.updateMany({ cateId: _id }, { status: newCategory?.status }, { new: true })
            return {
                success: true,
                msg: "Successfully update category 's status!",
                data: newCategory,
            }
        } catch (error) {
            return catchErr()
        }
    }

    @Mutation(() => CategoryObjectResponse, { nullable: true }) // Remove
    @UseMiddleware(authMiddleware)
    async removeCategory(
        @Ctx() ctx: IContext,
        @Arg("_id") _id: string
    ): Promise<CategoryObjectResponse> {
        const { userId } = ctx.req.user
        try {
            const exitedCategory = await Category.findOne({ _id })
            if (!exitedCategory) throw new ApolloError("Have no category ID")
            const removeFromUser = User.findOneAndUpdate({ $pull: { categories: _id } }).select(
                "-password"
            ) // remove cate to array of user owned
            const removeFromPost = Post.deleteMany({ category: _id }) // delete all posts of this category
            const removeCategory = Category.deleteOne({ _id }) // delete category

            await Promise.all([removeFromUser, removeFromPost, removeCategory])

            return {
                success: true,
                msg: "Successfully delete category!",
            }
        } catch (error: any) {
            return catchErr(error.message)
        }
    }
}
