import axios from "axios";

class Google {
	constructor() {
		this.apiKey = process.env.GOOGLEMAP_API_KEY;
		this.baseurl = "https://maps.googleapis.com/maps/api/geocode/json?address=";
	}

	async getGeocoding(address, next) {
		const reqUrl = `${this.baseurl}${encodeURIComponent(address)}&key=${
			this.apiKey
		}`;
		console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		console.log("request url :", reqUrl);
		console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

		try {
			const response = await axios.get(reqUrl);
			// console.log(response);

			if (!response.data.results || response.data.results < 1) {
				const err = new Error("Cannot find specified address");
				err.status = 400;
				console.log("status text", response.statusText);
				response.status = 400;
				response.statusText = "Bad request: Cannot find specified address";
				console.log(response.statusText);
				return response;
				// throw err;
			}
			return response;
		} catch (error) {
			console.error("Error fetching geocoding data:", error);
			return response;
			// next(error);
		}
	}
}

export default Google;
