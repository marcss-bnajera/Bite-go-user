import { Router } from "express";
import {
    getRestaurants
} from "./restaurants-controller.js";

const router = Router();

// GET 
router.get("/", getRestaurants);


export default router;