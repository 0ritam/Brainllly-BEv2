import {type Request, type Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export const userMiddleWare = (req:Request, res:Response, next:NextFunction) => {
    try{
        const token = req.headers.authorization
        if(!token){
            throw new Error("please enter the authorization key to continue")
        }
        if(process.env.JWT_SECRET){
            const decodedUser = jwt.verify(token, process.env.JWT_SECRET) as {id: string}
            req.userId = decodedUser.id
        }
        next();
    }
    catch(err){
        res.status(400).send(`Error occured while validating the user ${err}`)
    }
}