import axios from "axios";

class Chowdeck {
	constructor(CHOWDECK_MERCHANT_REFERENCE, CHOWDECK_INTEGRATION_KEY) {
		this.CHOWDECK_MERCHANT_REFERENCE = CHOWDECK_MERCHANT_REFERENCE;
		this.CHOWDECK_INTEGRATION_KEY = CHOWDECK_INTEGRATION_KEY;
		this.CHOWDECK_BASE_URL = `https://api.chowdeck.com/relay`;
	}

	/**
	 * Get a price estimate for delivery
	 * @param sourceAddress Longitude and Latitude of address to deliver from
	 * @param destinationAddress Longitude and Latitude of address to deliver to
	 * @returns Object with delivery fee details or error message
	 * @throws Error
	 */
	async createDeliveryFee(source_address, destination_address) {
		const url = this.getCreateDeliveryFeeUrl();
		const data = {
			source_address,
			destination_address,
		};
		console.log(
			">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
		);
		console.log("SENDING REQUEST WITH JSON DATA:");
		// console.log(JSON.stringify(data));
		const headers = {
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${this.CHOWDECK_INTEGRATION_KEY}`,
		};
		// console.log("Request Headers:", headers);
		let response;

		try {
			response = await axios.post(url, data, { headers });

			console.log(
				">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
			);
			// console.log("Response Data:", response.data);
			return {
				result: true,
				desc: "fee calculated successfully",
				error: 0,
				code: 200,
				response: response.data,
			};
		} catch (error) {
			// console.log(error);
			if (error.response.status === 500) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				console.log("Response data for server error:", error.response.data);
				return {
					result: false,
					desc: "distance was too large",
					code: 500,
					error: 5001,
				};
			} else if (error.request) {
				// The request was made but no response was received
				// console.log("Request data:", error.response.data);
				return {
					result: false,
					desc: error.response.data.message,
					code: error.status,
					error: 4001,
				};
			} else {
				// Something happened in setting up the request that triggered an Error
				console.log("Error message:", error.message);
				return {
					result: false,
					desc: "A Server error has occured try again ",
					code: 500,
					error: 4050,
				};
			}
		}
	}

	/**
	 * Create a delivery order
	 * @param sourceContact Contact details of sender (name, phone, and phone country code. Email is optional)
	 * @param destinationContact Contact details of receiver (name, phone, and phone country code. Email is optional)
	 * @param feeId ID of the delivery fee generated using createDeliveryFee
	 * @param itemType Type of item to deliver
	 * @returns {Promise<*>}
	 * @throws Error
	 */
	async createDeliveryOrder({
		sourceContact,
		destinationContact,
		feeId,
		itemType,
	}) {
		const url = this.getCreateDeliveryOrderUrl();
		const data = {
			source_contact: sourceContact,
			destination_contact: destinationContact,
			fee_id: feeId,
			item_type: itemType,
			user_action: "sending",
		};
		const headers = this.getRequestHeaders();

		let response;

		try {
			response = await axios.post(url, data, { headers });

			// console.log(response.data);

			if (response.status === "success") {
				console.log("order created successfully");
				return response.data;
			}
		} catch (error) {
			console.log("An errorr has occured", error);
			return {
				status: failed,
				desc: error.respone.data.message,
				code: error.status,
			};
		}
	}

	/**
	 * Track a delivery order
	 * @param orderId ID of the order to track (can be gotten from createDeliveryOrder)
	 * @returns {Promise<*>}
	 * @throws Error
	 */
	async trackDeliveryOrder(orderId) {
		const url = this.getTrackDeliveryOrderUrl(orderId);
		const headers = this.getRequestHeaders();

		let response = await fetch(url, {
			method: "GET",
			headers,
		});
		response = await response.json();

		if (response.status === "success") {
			return response.data;
		}

		throw new Error(response.message);
	}

	getCreateDeliveryFeeUrl() {
		return `${this.CHOWDECK_BASE_URL}/delivery/fee`;
	}

	getCreateDeliveryOrderUrl() {
		return `${this.CHOWDECK_BASE_URL}${this.CHOWDECK_MERCHANT_REFERENCE}/delivery`;
	}

	getTrackDeliveryOrderUrl(orderId) {
		return `${this.CHOWDECK_BASE_URL}delivery/${orderId}`;
	}

	getRequestHeaders() {
		return {
			"Content-Type": "application/json",
			Accept: "application/json",
			// Authorization: `Bearer ${this.CHOWDECK_INTEGRATION_KEY}`,
		};
	}
}

export default Chowdeck;
