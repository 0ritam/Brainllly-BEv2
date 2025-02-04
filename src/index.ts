import * as dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response } from "express";
import cors from "cors";
import { ContentModel, UserModel } from "./db";
import mongoose from "mongoose";
import { z } from "zod";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { userMiddleWare } from "./middleware";

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.SERVER_PORT;

app.post("/api/v2/signup", async (req: Request, res: Response) => {
  try {
    const zodValidation = z.object({
      username: z
        .string()
        .min(3, "enter min size 3 username")
        .max(20, "too long"),

      password: z
        .string()
        .min(8, "to short")
        .regex(
          /[A-Z]/,
          "password should contain atleast one uppercase character"
        )
        .regex(
          /[a-z]/,
          "password should contain atleast one lower case character"
        )
        .regex(/[0-9]/, "password should contain atleast one numeric character")
        .regex(
          /[\W_]/,
          "password should contain atleast one special character"
        ),
    });

    const parsedBody = zodValidation.safeParse(req.body);
    if (parsedBody.error) {
      throw new Error("Error occured while parsing teh JSON");
    }

    try {
      const { username, password } = req.body;

      const hashedPass = await bcrypt.hash(password ,5);

      await UserModel.create({
        username: username,
        password: hashedPass,
      });
      res.status(200).send("User signed up Successfully!"); //cant send .status.json togetheer i tcretaes eerror of multiple header
    } catch (err) {
      res.status(400).send("Pease enter Unique username");
    }
  } catch (err) {
    res.status(400).send(`Error occured...${err}`);
  }
});

app.post("/api/v2/signin", async (req: Request, res: Response) => {
  try {
    const {username, password}  = req.body;
    if(!username || !password) {
      throw new Error ("Please enter username and password or a unique username");
    }

    const userdata  = await UserModel.findOne({
      username: username,
    });

    if(!userdata) {
      throw new Error("User does not exsits..")
    }

    const compPassword = await bcrypt.compare(password, userdata.password);
    if(!compPassword) {
      throw new Error("Wrong password");
    }
    if (typeof process.env.JWT_SECRET === "string") {
      const token = jwt.sign({
        id: userdata._id,
      }, process.env.JWT_SECRET
      )

      res.status(200).send(token);
    } else{
      throw new Error("Error occured while genrating token")
    }

  } catch(err){
      res.status(400).send(`error occured in login ${err}`)
    
  }
});

app.post("/api/v2/content", userMiddleWare, async (req: Request, res: Response) => {

  try {
    const userId = req.userId;
    const { type, link, title, tags } = req.body;
    if (!type || !link || !title) {
      throw new Error("enter all the field to create a content");
    }
    await ContentModel.create({
      type: type,
      link: link,
      title: title,
      tags: tags,
      userId: userId,
    });
    res.status(200).send("Content added ..!");
  } catch (err) {
    res.status(400).send(`Error occured while creating .. ${err}`);
  }
});

app.get("/api/v2/content", (req: Request, res: Response) => {});

app.put("/api/v2/content/:contentId", (req: Request, res: Response) => {});

app.delete("/api/v2/content/:contentId", (req: Request, res: Response) => {});

app.post("/api/v2/brain/share", (req: Request, res: Response) => {});

app.post("/api/v2/brain/:shareLink", (req: Request, res: Response) => {});

const main = async () => {
  if (typeof process.env.MONGODB_URL === "string") {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database connected...");
  } else {
    console.log("Error While Connecting...");
  }

  app.listen(port, () => {
    console.log(`app is listening in ${port}`);
  });
};

main();
