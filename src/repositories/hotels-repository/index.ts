import { prisma } from "@/config";

async function retrieve(){

    const get = await prisma.hotel.findMany()
    return get

}

async function retrieveById(hotelId: number){

    
    const get = await prisma.hotel.findFirst({
        where: {id: hotelId},
        include: {
            Rooms: true
        }
    })

    
    return get

}

const hotelsRepository = {

    retrieve,
    retrieveById

}

export default hotelsRepository