import * as dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response } from "express";
import cors from "cors";
import { ContentModel, LinkModel, UserModel } from "./db";
import mongoose from "mongoose";
import { z } from "zod";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { userMiddleWare } from "./middleware";
import { hashGenerator } from "./hashGenerator";

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

app.get("/api/v2/content",userMiddleWare, async (req: Request, res: Response) => {

  try{
    const userId = req.userId;
    const userConData = await ContentModel.find({
      userId: userId,
    }).populate("userId","username");

    res.status(200).json({
      userConData : userConData
    })

  } catch (err){
    res.status(400).send(`error occured while fetching content ${err}`)

  }
});

app.put("/api/v2/content/:contentId", userMiddleWare, async (req: Request, res: Response) => {
  try{
      const userId = req.userId;
      const {type, link,title, tags} = req.body
      const contentId = req.params.contentId;

      if(!contentId) {
        throw new Error("Please provide the content id to update the data");

      }
      const contentUpadation = await ContentModel.updateOne({
        _id : contentId,
        userId: userId,
      },
      {$set:{type, link,title, tags}}
    );
    res.status(200).send(`Upadated successfully`);
  } catch (err){
    res.status(500).send(`Error occured while updating ${err}`);

  }
});

app.delete("/api/v2/content/:contentId", userMiddleWare,async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const contentId = req.params.contentId;

    if(!contentId) {
      throw new Error("Please provide the id to delete")
    }
    const result = await ContentModel.deleteOne({
      _id: contentId,
      userId: userId,
    });
    if (result.deletedCount === 0) {
      res.status(400).send("You are not authorized to delete the data");
      return;
    }
    res.status(200).send("Content delete for the given id successfully");
  } catch(err){

    res.status(400).send(`Error occured while deleting the content ${err}`);
  }
});

app.post("/api/v2/brain/share",userMiddleWare,async(req: Request, res: Response) => {

  try {
    const share  = req.body.share;
    if(share === true) {
      const existingLink = await LinkModel.findOne({
        userId:req.userId,
      })

      if(existingLink) {
        res.status(200).json({
          hash:existingLink.hash,
        })
        return;
      }

      const hash = hashGenerator(10);
      const result = await LinkModel.create({
        hash: hash,
        userId: req.userId,
      });
      res.status(200).json({
        message: "Hash generated successfully",
        link: result.hash,
      });
      return;

    } else if( share === false ) {
      await LinkModel.deleteOne({
        userId: req.userId,
      });
      res.status(200).send("hash Deleted successfully");
    }
  } catch(err) {
    res.status(400).send(`Error occured while generating the hash ${err}`)

  }

});

app.post("/api/v2/brain/:shareLink",userMiddleWare, async (req: Request, res: Response) => {
  try {
    const hash = req.params.shareLink;
    const link = await LinkModel.findOne({
      hash: hash,

    });

    if(!link) {
      res.status(404).send("This link does not exits");
      return;
    }
    const content = await ContentModel.find({
      userId: link.userId,
    }).populate("userId", "username");
    res.status(400).json({
      content
    })
  } catch(err){
    res.status(400).send(`Eoor occured while loading the content ${err}`)

  }
});

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
