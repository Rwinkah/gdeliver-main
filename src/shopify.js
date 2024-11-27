import axios from "axios";

class Shopify {
	/**
	 * Initialize the shopify class with required credentials
	 */
	constructor() {
		this.apiKey = process.env.SHOPIFY_API_KEY;
		this.adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
		this.storeName = process.env.SHOPIFY_STORE_NAME;
		this.base64Credentials = btoa(`${this.apiKey}:${this.adminToken}`);
		this.baseUrl = `https://${this.storeName}.myshopify.com/admin/api/2024-01`;
		this.defaultID = 66882535511;
	}

	/**
	 * Fetches the inventory locationsn of the shopify store
	 * @returns {Promise<object>} An object containing all inventory locations available in the store
	 * @throws Throws an error if fetch fails of there are no locations
	 */
	async getAllLocations() {
		const url = `${this.baseUrl}/locations.json`;
		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Basic ${this.base64Credentials}`,
					"Content-Type": "application/json",
				},
			});
			const data = await response.json();
			console.log(data);

			if (data.locations && data.locations.length > 0) {
				const defaultLocation = data.locations[0];
				return {
					latitude: defaultLocation.latitude,
					longitude: defaultLocation.longitude,
				};
			} else {
				throw new Error("No locations found.");
			}
		} catch (error) {
			console.error("Error fetching default location:", error);
			throw error;
		}
	}

	/**
	 * Fetch location metadata for a single inventory location to get geo coordinates
	 * @returns {Promise<object>} An object containing longitude and lattitude of the location specified or the default location if no location is specified
	 * @throws WIll throw an error if the fetch request fails
	 */
	async getInventoryLocation(id = this.defaultID) {
		const locationID = id;
		try {
			const response = await fetch(
				`${this.baseUrl}/locations/${locationID}/metafields.json`,
				{
					method: "GET",
					headers: {
						Authorization: `Basic ${this.base64Credentials}`,
						"Content-Type": "application/json",
					},
				}
			);
			const metaData = await response.json();

			// Extract latitude and longitude from the metadata if available
			const latitudeMetafield = metaData.metafields.find(
				(field) => field.key === "latitude"
			);
			const longitudeMetafield = metaData.metafields.find(
				(field) => field.key === "longtitude"
			);

			// Extract lattitude and longitude from the metadata if available
			const latitude = latitudeMetafield
				? parseFloat(latitudeMetafield.value)
				: null;
			const longitude = longitudeMetafield
				? parseFloat(longitudeMetafield.value)
				: null;

			return { longitude: longitude, latitude: latitude };
		} catch (error) {
			console.error("Error fetching location metadata:", error);
			throw error;
		}
	}

	/**
	 * Register a carrier service for custom shipping rates
	 * @returns {Promise<object>} An object containing details of the registered carrier service
	 * @throws Will throw an error if the registration fails
	 */
	async registerCarrierService() {
		const url = `${this.baseUrl}/carrier_services.json`;
		const data = {
			carrier_service: {
				name: "Gdelivery",
				callback_url: "https://3733-197-211-59-110.ngrok-free.app/gdeliver",
				service_discovery: true,
				format: "json",
			},
		};

		try {
			const response = await axios.post(url, data, {
				headers: {
					Authorization: `Basic ${this.base64Credentials}`,
					"Content-Type": "application/json",
				},
			});
			console.log("Carrier Service Registered:", response.data);
			return response.data;
		} catch (error) {
			console.error("Error registering carrier service:", error);
			throw error;
		}
	}

	/**
	 * Update the callback URL for the Carrier Service
	 * @param {string} carrierServiceId - The ID of the carrier service to update
	 * @param {string} newCallbackUrl - The new callback URL to set
	 * @returns {Promise<object>} - The updated carrier service data
	 * @throws Will throw an error if the update fails
	 */
	async updateCarrierService(carrierServiceId, newCallbackUrl) {
		const url = `${this.baseUrl}/carrier_services/${carrierServiceId}.json`;

		try {
			const response = await axios.put(
				url,
				{
					carrier_service: {
						callback_url: newCallbackUrl,
						// Keep existing properties unchanged
						service_discovery: true,
					},
				},
				{
					headers: {
						Authorization: `Basic ${this.base64Credentials}`,
						"Content-Type": "application/json",
					},
				}
			);

			console.log("Carrier service updated:", response.data);
			return response.data;
		} catch (error) {
			console.error("Error updating carrier service:", error);
			throw error;
		}
	}
}

export default Shopify;
