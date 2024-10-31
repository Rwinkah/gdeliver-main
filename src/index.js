import express from "express";
import ClickNShip from "./clickNShip.js";
import Chowdeck from "./chowdeck.js";
import dotenv from "dotenv";
import Shopify from "./shopify.js";
// import bodyParser from "body-parser";
import cors from "cors";
import Google from "./google.js";

const app = express();
const port = 4000;

dotenv.config();

app.use(express.json());
app.use(cors({ origin: "*" }));

const CLICK_N_SHIP_USERNAME = process.env.CLICK_N_SHIP_USERNAME;
const CLICK_N_SHIP_PASSWORD = process.env.CLICK_N_SHIP_PASSWORD;
const CHOWDECK_MERCHANT_REFERENCE = process.env.CHOWDECK_MERCHANT_REFERENCE;
const CHOWDECK_INTEGRATION_KEY = process.env.CHOWDECK_INTEGRATION_KEY;

const clickNShipIntegration = new ClickNShip(
	CLICK_N_SHIP_USERNAME,
	CLICK_N_SHIP_PASSWORD
);
const chowdeckIntegration = new Chowdeck(
	CHOWDECK_MERCHANT_REFERENCE,
	CHOWDECK_INTEGRATION_KEY
);

const googleIntegration = new Google();

const shopifyIntegration = new Shopify();
// ClickNShip routes
app.get("/clicknship/states", async (req, res) => {
	try {
		const availableStates = await clickNShipIntegration.getAvailableStates();
		res.json(availableStates);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get("/clicknship/cities/:stateName", async (req, res) => {
	try {
		const citiesInState = await clickNShipIntegration.getAvailableCitiesInState(
			req.params.stateName
		);
		res.json(citiesInState);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get("/clicknship/towns/:cityCode", async (req, res) => {
	try {
		const townsInCity = await clickNShipIntegration.getAvailableTownsInCity(
			req.params.cityCode
		);
		res.json(townsInCity);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post("/clicknship/delivery-fee", async (req, res) => {
	try {
		const { originCity, destinationCity, weight } = req.body;
		const priceEstimate = await clickNShipIntegration.createDeliveryFee(
			originCity,
			destinationCity,
			weight
		);
		res.json(priceEstimate);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post("/clicknship/pickup-request", async (req, res) => {
	try {
		const { orderDetails, senderDetails, recipientDetails } = req.body;
		const pickupRequest = await clickNShipIntegration.placePickupRequest(
			orderDetails,
			senderDetails,
			recipientDetails
		);
		res.json(pickupRequest);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Chowdeck routes
app.post("/chowdeck/delivery-fee", async (req, res) => {
	const data = req.body;
	try {
		const sourceAddress = data.sourceAddress;
		destinationAddress = data.destinationAddress;
		const fees = await chowdeckIntegration.createDeliveryFee(
			sourceAddress,
			destinationAddress
		);
		res.json(fees);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post("/chowdeck/delivery-order", async (req, res) => {
	try {
		const { sourceContact, destination_address, feeId, itemType } = req.body;
		const order = await chowdeckIntegration.createDeliveryOrder(
			sourceContact,
			destination_address,
			feeId,
			itemType
		);
		res.json(order);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.get("/chowdeck/track/:orderId", async (req, res) => {
	try {
		const orderStatus = await chowdeckIntegration.trackDeliveryOrder(
			req.params.orderId
		);
		res.json(orderStatus);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// SHOPIFY ROUTES

/**
 * @route /shopify/webhooks/order/create
 * @description Handles shopify create order webhook and uses the data to calculate delivery fee
 * @returns {number} Delivery fee calculated through chowdeck
 */
app.post("/shopify/webhooks/order/create", async (req, res) => {
	const orderData = req.body;
	const shippingAddress = orderData.shipping_address;
	console.log(
		">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
	);
	console.log("ORDER RECIEVED");

	if (!shippingAddress) {
		res
			.status(400)
			.json({ error: "bad request, shipping details not present" });
		console.log("bad request, shipping details not present");
		return;
	}

	console.log("SHIPPING ADDRESS\n", shippingAddress);

	// Extract latitude and longitude from the shipping address
	const customerLatitude = shippingAddress.latitude;
	const customerLongitude = shippingAddress.longitude;

	// Check if customer latitude and longitude are provided
	if (!customerLatitude || !customerLongitude) {
		console.log("bad request, Customer latitude and longitude are required.");

		return res
			.status(400)
			.send({ error: "Customer latitude and longitude are required." });
	}

	const destination_address = {
		latitude: customerLatitude,
		longitude: customerLongitude,
	};

	console.log(
		">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
	);
	console.log("FETCHING INVENTORY LOCATION");
	try {
		const source_address = await shopifyIntegration.getInventoryLocation();

		// Check if sourceContact response is okay
		if (
			!source_address ||
			!source_address.latitude ||
			!source_address.longitude
		) {
			return res
				.status(400)
				.send({ error: "Source contact latitude and longitude are required." });
		} else {
			console.log("INVENTORY FOUND\n", source_address, "\n");
		}

		// Calculate delveryFee
		console.log(
			">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
		);
		console.log("CALCULATING DELIVERY FEE");
		console.log(
			"DELIVERY DETAILS\n",
			"SOURCE ADDRESS\n",
			source_address,
			"\n",
			"DESTINATION ADDRESS\n",
			destination_address
		);
		const delivery = chowdeckIntegration.createDeliveryFee(
			source_address,
			destination_address
		);

		// Send the response back to Shopify
		return res.status(200).send(delivery.data);
	} catch (error) {
		console.error("Error processing order:", error);
		return res.status(500).send({ error: "Internal Server Error" });
	}
});

app.post("/shopify/checkout", async (req, res, next) => {
	const address = req.body.address;
	console.log(address);
	const geocodeResponse = await googleIntegration.getGeocoding(address, next);

	if (geocodeResponse.status === 400) {
		console.log("no address found");
		res.status(400).json({ error: "no address found" });
	}

	const destination_address = {
		longitude: geocodeResponse.data.results[0].geometry.location.lng,
		latitude: geocodeResponse.data.results[0].geometry.location.lat,
	};

	try {
		const source_address = await shopifyIntegration.getInventoryLocation();

		// Check if sourceContact response is okay
		if (
			!source_address ||
			!source_address.latitude ||
			!source_address.longitude
		) {
			return res
				.status(400)
				.send({ error: "Source contact latitude and longitude are required." });
		} else {
			console.log("INVENTORY FOUND\n", source_address, "\n");
		}

		// Calculate delveryFee
		console.log(
			">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
		);
		console.log("CALCULATING DELIVERY FEE");
		console.log(
			"DELIVERY DETAILS\n",
			"SOURCE ADDRESS\n",
			source_address,
			"\n",
			"DESTINATION ADDRESS\n",
			destination_address
		);
		const delivery = await chowdeckIntegration.createDeliveryFee(
			source_address,
			destination_address
		);
		console.log("result for delivery fee", delivery);

		// Send the response back to Shopify
		return res.status(delivery.code).send(delivery);
	} catch (error) {
		console.error("Error processing order:", error);
		return res.status(500).send({ error: "Internal Server Error" });
	}
});

// GOOGLE ROUTES

app.post("/google/geocode", async (req, res) => {
	const address = req.body.address;
	console.log("address", address);
	if (!address) {
		res.status(400).json({ ERROR: "Bad Request, missing address variable" });
		console.log("Bad Request, missing address variable");
		return;
	}
	const response = await googleIntegration.getGeocoding(address);
	console.log(response.data);
	if (response.data.results === undefined || response.data.results.length < 1) {
		res
			.status(400)
			.json({ ERROR: "Bad Request, cannot find the specified address" });
		console.log("Bad Request, cannot find the specified address");
		return;
	}
	res
		.status(200)
		.json({ response: response.data.results[0].geometry.location });
});

app.use((req, res, next) => {
	res.status(404).json({
		status: "error",
		message: "Not Found - The requested resource does not exist.",
	});
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
