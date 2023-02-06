import hotelsRepository from "@/repositories/hotels-repository"
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import paymentRepository from "@/repositories/payment-repository";
import { notFoundError, paymentRequiredError } from "@/errors";


async function retrieveHotels(id: number){

    const verificaEnrollment = await enrollmentRepository.findByUserId(id)

    if(!verificaEnrollment){
        
        return []
    }

    const verificaTicket = await ticketRepository.findTicketByEnrollmentId(verificaEnrollment.id)
    
    if(!verificaTicket){
        
        return []
    }

    const verificaPayment = await paymentRepository.findPaymentByTicketId(verificaTicket.id)

    if(verificaTicket.TicketType.includesHotel === false || verificaTicket.TicketType.isRemote === true || !verificaPayment){
        return "ERRO 402 PAYMENT REQUIRED"
    }

    const get = await hotelsRepository.retrieve()

    if(!get){
        throw notFoundError()
    }

    return get

}


async function retrieveHotelById(id: number, hotelId: number): Promise<any>{


    
    const verificaEnrollment = await enrollmentRepository.findByUserId(id)

    
    if(!verificaEnrollment){
        
        return []
    }


    const verificaTicket = await ticketRepository.findTicketByEnrollmentId(verificaEnrollment.id)
    

    if(!verificaTicket){
        
        return []
    }
    

    const verificaPayment = await paymentRepository.findPaymentByTicketId(verificaTicket.id)
    

    if(verificaTicket.TicketType.includesHotel === false || verificaTicket.TicketType.isRemote === true || !verificaPayment){
        return "ERRO 402 PAYMENT REQUIRED"
    }

    const hotel = await hotelsRepository.retrieve()
    if(!hotel){
        return []
    }

    const get = await hotelsRepository.retrieveById(hotelId)

    if(!get){
        throw notFoundError()
    }

    return get

}


const hotelsServices = {
    retrieveHotels,
    retrieveHotelById
}

export default hotelsServices