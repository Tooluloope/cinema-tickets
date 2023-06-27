import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";

export default class TicketService {
	/**
	 * Should only have private methods other than the one below.
	 */

	#paymentService;
	#seatReservationService;
	#ticketPrices = {
		"ADULT": 20,
		"CHILD": 10,
		"INFANT": 0,
	};

	constructor(paymentService, seatReservationService) {
		this.#paymentService = paymentService;
		this.#seatReservationService = seatReservationService;
	}

	#calculateTotalAmount(ticketTypeRequests) {
		return ticketTypeRequests.reduce((total, request) => {
			return (
				total +
				this.#ticketPrices[request.getTicketType()] * request.getNoOfTickets()
			);
		}, 0);
	}

	#calculateTotalSeats(ticketTypeRequests) {
		return ticketTypeRequests.reduce((total, request) => {
			if (request.getTicketType() !== "INFANT") {
				return total + request.getNoOfTickets();
			} else {
				return total;
			}
		}, 0);
	}

	#validateTicketRequests(ticketTypeRequests) {
		const totalTickets = ticketTypeRequests.reduce(
			(total, request) => total + request.getNoOfTickets(),
			0
		);
		if (totalTickets > 20) {
			throw new InvalidPurchaseException(
				"Cannot purchase more than 20 tickets at a time"
			);
		}

		const hasAdultTicket = ticketTypeRequests.some(
			request => request.getTicketType() === "ADULT"
		);
		if (!hasAdultTicket) {
			throw new InvalidPurchaseException(
				"Cannot purchase child or infant tickets without purchasing an adult ticket"
			);
		}
	}

	purchaseTickets(accountId, ...ticketTypeRequests) {
		// throws InvalidPurchaseException

		if (accountId <= 0) {
			throw new InvalidPurchaseException("Invalid account ID");
		}

		this.#validateTicketRequests(ticketTypeRequests);

		const totalAmount = this.#calculateTotalAmount(ticketTypeRequests);
		const totalSeats = this.#calculateTotalSeats(ticketTypeRequests);

		this.#paymentService.makePayment(accountId, totalAmount);
		this.#seatReservationService.reserveSeat(accountId, totalSeats);
	}
}
