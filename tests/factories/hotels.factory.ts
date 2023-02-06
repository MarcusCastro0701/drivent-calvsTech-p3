import faker from "@faker-js/faker"
import { prisma } from "@/config";

async function createHotel(){
    const create = await prisma.hotel.create({
        data: {
            name: faker.name.findName(),
            image: faker.image.abstract()
        }
    })
    return create
};

async function createRoom(hotelId: number){
    const create = await prisma.room.create({
        data: {
            name: faker.name.findName(),
            capacity: faker.datatype.number(),
            hotelId: hotelId
        }
    })
    return create
}

const hotelsFactory = {

    createHotel,
    createRoom
}

export default hotelsFactory