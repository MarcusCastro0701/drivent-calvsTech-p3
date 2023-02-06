import { AuthenticatedRequest } from "@/middlewares";
import hotelsServices from "@/services/hotels-service";
import enrollmentsService from "@/services/enrollments-service";
import { Request, Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response){

    const id = req.userId

    const userId = Number(id)
    

    const result = await hotelsServices.retrieveHotels(userId);

    try {

        if(result.length === 0){
            res.sendStatus(httpStatus.NOT_FOUND)
        }

        if(result === "ERRO 402 PAYMENT REQUIRED"){
            res.sendStatus(httpStatus.PAYMENT_REQUIRED)
        }
    
        return res.status(200).send(result)
        
    } catch (error) {
        return res.status(httpStatus.NOT_FOUND).send(error)
    }

}

export async function getHotelsById(req: AuthenticatedRequest, res: Response){

    
    const uid = req.userId
    const hid = req.params.hotelId

    const userId = Number(uid)
    const hotelId = Number(hid)

    const result = await hotelsServices.retrieveHotelById(userId, hotelId)
    
    try {
        
        console.log(result, "result")
        if(result.length === 0 || result === null){
            res.sendStatus(httpStatus.NOT_FOUND)
        }

        if(result === "ERRO 402 PAYMENT REQUIRED"){
            res.sendStatus(httpStatus.PAYMENT_REQUIRED)
        }
        
        return res.status(200).send(result)

    } catch (error) {
        
        return res.status(httpStatus.NOT_FOUND).send(error)
    }

}