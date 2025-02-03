import { model, Schema, Types } from "mongoose";

const UserSchema = new Schema({
    username:{type:String, unique:true, required:true},
    password: {type:String, required:true}
})


const contentTypes = ["YouTube", "X", "Documents", "Links"]

const ContentSchema = new Schema({
    link:{type:String, required:true},
    type: {type:String, enum:contentTypes, required:true},
    title: {type:String, required:true},
    tags: {type:Types.ObjectId, ref:"Tags"},
    userId: {type:Types.ObjectId, ref:"users", reqyired:true}
})

const TagsSchema = new Schema({
    title:{type:String, required:true, unique:true}
})

const LinkSchema = new Schema({
    hash:{type:String, required:true, unique:true},
    userId: {type: Types.ObjectId, ref:"users", required:true, unique:true}
})

export const UserModel = model("users", UserSchema)
export const ContentModel = model("content", ContentSchema)
export const LinkModel = model("links", LinkSchema)
export const TagsModel = model("tags", TagsSchema)
