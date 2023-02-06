import app, { init } from "@/app";
import { prisma } from "@/config";
import { generateCPF, getStates } from "@brazilian-utils/brazilian-utils";
import faker from "@faker-js/faker";
import dayjs from "dayjs";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import hotelsFactory from "../factories/hotels.factory";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicketType,
  createTicket,
  createPayment,
  createTicketTypeIncludesHotelFalse,
  createTicketTypeIsRemoteTrue,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
    await init();
    await cleanDb();
    await prisma.hotel.deleteMany({});
});

const server = supertest(app);

describe("GET /hotel", () => {

    it("should respond with status 401 if no token is given", async () => {
        const response = await server.get("/hotel");
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    })

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.get("/hotel").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

});

describe("when token is valid", () => {

    it("should respond with status 204 when there is no hotel", async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        await createPayment(ticket.id, ticketType.price);

        const response = await server.get("/hotel").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.NOT_FOUND);
    })

    it("should respond with status 200 when there is hotel", async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        await createPayment(ticket.id, ticketType.price);

        hotelsFactory.createHotel();

        const response = await server.get("/hotel").set("Authorization", `Bearer ${token}`);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(Number),
                    name: expect.any(String),
                    image: expect.any(String),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                })
            ])
        )

        await prisma.hotel.deleteMany({});
    });

    it("should respond with status 404 when there is no enrollment", async () => {

        const user = await createUser();
        const token = await generateValidToken(user);

        const response = await server.get("/hotel").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.NOT_FOUND)
    })

    it("should respond with status 404 when there is no ticket", async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);

        const response = await server.get("/hotel").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.NOT_FOUND)
    })

    it("should respond with status 402 when do not includes hotel", async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeIncludesHotelFalse();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get("/hotel").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED)

    });

    it("should respond with status 402 when ticket type is remote", async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeIsRemoteTrue();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get("/hotel").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED)

    });

    it("should respond with status 402 when there is no payment", async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeIncludesHotelFalse();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get("/hotel").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED)

    });

});

describe("GET /hotel/:hotelId", () => {

    it("should respond with status 401 if no token is given", async () => {
        const response = await server.get("/hotel/:hotelId");
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    })

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.get("/hotel/:hotelId").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

});

describe("when token is valid", () => {

    it("should respond with status 204 when there is no hotel", async () => {

        const hotelId = -1
        const user = await createUser();
        const token = await generateValidToken(user);

        const response = await server.get(`/hotel/${hotelId}`).set("Authorization", `Bearer ${token}`);

        
        expect(response.status).toBe(httpStatus.NOT_FOUND);
    })

    it("should respond with status 200 when there is room", async () => {

        const hotel = await hotelsFactory.createHotel();
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        await createPayment(ticket.id, ticketType.price);
        
        const hotelId = Number(hotel.id)
        const room = await hotelsFactory.createRoom(hotelId)

        const response = await server.get(`/hotel/${hotel.id}`).set("Authorization", `Bearer ${token}`);

        expect(response.body).toMatchObject({
            id: hotel.id,
            name: hotel.name,
            image: hotel.image,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            Rooms: [
                {
                    id: room.id,
                    name: room.name,
                    capacity: room.capacity,
                    hotelId: room.hotelId,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String)
                }
            ]

        }
                

        )

    });

    it("should respond with status 404 when there is no enrollment", async () => {

        const hotel = await hotelsFactory.createHotel();
        const user = await createUser();
        const token = await generateValidToken(user);

        const response = await server.get(`/hotel/${hotel.id}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.NOT_FOUND)
    });

    it("should respond with status 404 when there is no ticket", async () => {

        const hotel = await hotelsFactory.createHotel();
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get(`/hotel/${hotel.id}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED)
    });

    it("should respond with status 404 when do not includes hotel", async () => {

        const hotel = await hotelsFactory.createHotel();
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeIncludesHotelFalse();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get(`/hotel/${hotel.id}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED)
    });

    it("should respond with status 404 when hotel is not remote", async () => {

        const hotel = await hotelsFactory.createHotel();
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeIsRemoteTrue();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get(`/hotel/${hotel.id}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED)
    });

    it("should respond with status 404 when there is no payment", async () => {

        const hotel = await hotelsFactory.createHotel();
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get(`/hotel/${hotel.id}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED)
    });

});


