import express from "express";

declare global{   //This tells TypeScript that we're modifying the global scope.
    namespace Express{      //Express here refers to the namespace from @types/express.
        interface Request{
            userId?: String
        }
    }
}