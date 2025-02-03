import * as dotenv from "dotenv";
dotenv.config();
import express,{type Request, type Response} from "express";
import cors from "cors";
import { UserModel } from "./db";
import mongoose from "mongoose";


const app = express();
app.use(express.json());
app.use(cors());
const port  = process.env.SERVER_PORT

app.post("/api/v2/signup", async(req:Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;
    try{
        // const parsedBody = safeParse(req.body);
        // if(parsedBody.error) {
        //     throw new Error("Error occured while parsing teh JSON")
        // }

        // const {username, password} = req.body;

        await UserModel.create({
            username: username,
            password: password
        });
        res.status(200).send("User signed up Successfully!") //cant send .status.json togetheer i tcretaes eerror of multiple header


    } catch (err){
        res.status(400).send("Pease enter Unique username");
    } 
})


app.post("/api/v2/signin", (req:Request, res:Response)=>{

})


app.post("/api/v2/content", (req:Request, res:Response)=>{

})

app.get("/api/v2/content", (req:Request, res:Response)=>{

})

app.put("/api/v2/content/:contentId", (req:Request, res:Response)=>{

})

app.delete("/api/v2/content/:contentId", (req:Request, res:Response)=>{

})

app.post("/api/v2/brain/share", (req:Request, res:Response)=>{

})

app.post("/api/v2/brain/:shareLink", (req:Request, res:Response)=>{

})

const main = async () => {
    if (typeof process.env.MONGODB_URL === "string") {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Database connected...")
    } else{
        console.log("Error While Connecting...")

    }

    app.listen(port, () => {
        console.log(`app is listening in ${port}`);
    })
}

main();
