class ClickNShip {
	constructor(CLICK_N_SHIP_USERNAME, CLICK_N_SHIP_PASSWORD) {
		this.CLICK_N_SHIP_BASE_URL = `https://api.clicknship.com.ng`;
		this.CLICK_N_SHIP_USERNAME = CLICK_N_SHIP_USERNAME;
		this.CLICK_N_SHIP_PASSWORD = CLICK_N_SHIP_PASSWORD;
		this.BEARER_TOKEN = null;
	}

	/**
	 * Get ClickNShip auth token
	 * @returns Auth token
	 */
	async getAuthToken() {
		const url = `${this.CLICK_N_SHIP_BASE_URL}/token`;
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		let response = await fetch(url, {
			method: 'POST',
			headers,
			body: `username=cnsdemoapiacct&password=ClickNShip$12345&grant_type=password`,
			// body: `username=${this.CLICK_N_SHIP_USERNAME}&password=${this.CLICK_N_SHIP_PASSWORD}&grant_type=password`,
		});
		response = await response.json();

		return response.access_token;
	}

	/**
	 * Get available states from which items can be shipped from or delivered to using ClickNShip
	 * @returns List of available states
	 */
	async getAvailableStates() {
		const url = `${this.CLICK_N_SHIP_BASE_URL}/clicknship/Operations/States`;
		const headers = await this.getAuthenticatedHeaders();

		let response = await fetch(url, {
			headers,
		});
		response = await response.json();

		if (response.error) {
			throw new Error(response.error);
		}

		return response;
	}

	/**
	 * Get available cities in a state
	 * @param stateName State name as returned by getAvailableStates
	 * @returns List of available cities in the state
	 */
	async getAvailableCitiesInState(stateName) {
		const url = `${this.CLICK_N_SHIP_BASE_URL}/clicknship/Operations/StateCities?StateName=${stateName.toUpperCase()}`;
		const headers = await this.getAuthenticatedHeaders();

		let response = await fetch(url, {
			headers,
		});
		response = await response.json();

		return response;
	}

	/**
	 * Get available towns in a city
	 * @param cityCode City code as returned by getAvailableCitiesInState
	 * @returns List of available towns in the city
	 */
	async getAvailableTownsInCity(cityCode) {
		const url = `${this.CLICK_N_SHIP_BASE_URL}/clicknship/Operations/DeliveryTowns?CityCode=${cityCode.toUpperCase()}`;
		const headers = await this.getAuthenticatedHeaders();

		let response = await fetch(url, {
			headers,
		});
		response = await response.json();

		return response;
	}

	async placePickupRequest(orderDetails, senderDetails, recipientDetails) {
		const url = `${this.CLICK_N_SHIP_BASE_URL}/clicknship/Operations/PickupRequest`;
		const headers = await this.getAuthenticatedHeaders();
		const data = {
			OrderNo: this.generateOrderNo(),
			Description: orderDetails.description,
			SenderName: senderDetails.name,
			SenderCity: senderDetails.city.trim().toUpperCase(),
			SenderTownID: senderDetails.townID,
			SenderAddress: senderDetails.address,
			SenderPhone: senderDetails.phone,
			SenderEmail: senderDetails.email,
			RecipientName: recipientDetails.name,
			RecipientCity: recipientDetails.city.trim().toUpperCase(),
			RecipientTownID: recipientDetails.townID,
			RecipientAddress: recipientDetails.address,
			RecipientPhone: recipientDetails.phone,
			RecipientEmail: recipientDetails.email,
			PaymentType: "Prepaid",
			DeliveryType: "Normal Delivery",
			PickupType: "1",
			Weight: orderDetails.Weight,
			ShipmentItems: orderDetails.items
		};

		let response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify(data),
		});
		response = await response.json();

		return response;
	}

	generateOrderNo() {
		return `Ord-${Math.floor(Math.random() * 10000000)}`;
	}

	async createDeliveryFee(originCity, destinationCity, weight) {
		const url = `${this.CLICK_N_SHIP_BASE_URL}/clicknship/Operations/DeliveryFee`;
		const headers = await this.getAuthenticatedHeaders();
		const data = {
			Origin: originCity,
			Destination: destinationCity,
			Weight: weight,
			PickupType: "1"
		};

		let response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify(data),
		});
		response = await response.json();

		return response;
	}

	async getAuthenticatedHeaders() {
		if (this.BEARER_TOKEN) {
			return {
				'Authorization': `Bearer ${this.BEARER_TOKEN}`,
				'Content-Type': 'application/json',
			};
		}

		this.BEARER_TOKEN = await this.getAuthToken();

		return {
			'Authorization': `Bearer ${this.BEARER_TOKEN}`,
			'Content-Type': 'application/json',
		};
	}
}

export default ClickNShip;
