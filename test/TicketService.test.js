import { jest } from "@jest/globals";

import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import TicketService from "../src/pairtest/TicketService";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService";
// Mocking external services
jest.mock("../src/thirdparty/paymentgateway/TicketPaymentService");
jest.mock("../src/thirdparty/seatbooking/SeatReservationService");

jest.spyOn(TicketPaymentService.prototype, "makePayment");

jest.spyOn(SeatReservationService.prototype, "reserveSeat");

describe("TicketService", () => {
	let paymentService;
	let reservationService;
	let ticketService;

	beforeEach(() => {
		// Clear all instances and calls to constructor and all methods:

		jest.resetAllMocks();

		paymentService = new TicketPaymentService();
		reservationService = new SeatReservationService();

		ticketService = new TicketService(paymentService, reservationService);
	});

	it("should purchase tickets successfully", () => {
		const accountId = 123;
		const adultTicketRequest = new TicketTypeRequest("ADULT", 2);
		const childTicketRequest = new TicketTypeRequest("CHILD", 1);

		ticketService.purchaseTickets(
			accountId,
			adultTicketRequest,
			childTicketRequest
		);

		expect(paymentService.makePayment).toHaveBeenCalledTimes(1);
		expect(paymentService.makePayment).toHaveBeenCalledWith(accountId, 50);

		expect(reservationService.reserveSeat).toHaveBeenCalledTimes(1);
		expect(reservationService.reserveSeat).toHaveBeenCalledWith(123, 3);
	});

	it("should throw InvalidPurchaseException for invalid accountId", () => {
		const accountId = -1; // Invalid accountId
		const adultTicketRequest = new TicketTypeRequest("ADULT", 2);
		const childTicketRequest = new TicketTypeRequest("CHILD", 1);

		expect(() => {
			ticketService.purchaseTickets(
				accountId,
				adultTicketRequest,
				childTicketRequest
			);
		}).toThrow("Invalid account ID");
	});

	it("should throw InvalidPurchaseException for more than 20 tickets", () => {
		const accountId = 123;
		const adultTicketRequest = new TicketTypeRequest("ADULT", 21); // More than 20 tickets

		expect(() => {
			ticketService.purchaseTickets(accountId, adultTicketRequest);
		}).toThrow("Cannot purchase more than 20 tickets at a time");
	});

	it("should throw InvalidPurchaseException for child or infant tickets without adult tickets", () => {
		const accountId = 123;
		const childTicketRequest = new TicketTypeRequest("CHILD", 1); // Child ticket without adult ticket

		expect(() => {
			ticketService.purchaseTickets(accountId, childTicketRequest);
		}).toThrow(
			"Cannot purchase child or infant tickets without purchasing an adult ticket"
		);
	});
});
