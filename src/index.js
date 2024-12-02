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
app.use(
	cors({
		origin: "*", // Only use this for testing. Do not use in production.
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);
app.options("*", cors()); // Allow CORS preflight requests for all routes
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "https://shop.nettpharmacy.com"); // Replace with your domain
	res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		return res.sendStatus(200);
	}

	next();
});

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

//TEST ROUTES
app.get("/test", async (req, res) => {
	console.log("backedn working");
	res.status(200).send("hello");
});
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
	console.log(
		">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
	);
	console.log(orderData);
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
		const deliveryFee = chowdeckIntegration.createDeliveryFee(
			source_address,
			destination_address
		);

		console.log("CREATING ORDER");
		console.log(deliveryFee);
		const feeId = await deliveryFee.response.data.feeId;
		const locationDetails =
			await shopifyIntegration.getInventoryLocationDetails();

		const orderCreateData = {
			destination_contact: {
				name: shippingAddress.name,
				phone: shippingAddress.phone,
				country_code: "NG",
				email: orderData.customer.email,
			},
			source_contact: {
				name: locationDetails.name,
				phone: locationDetails.phone,
				country_code: locationDetails.country_code,
				email: locationDetails.email,
			},
			fee_id: feeId,
			item_type: "pharmaceuticals",
			user_action: "sending",
			customer_delivery_note: "",
		};

		const createDelivery = await chowdeckIntegration.createDeliveryOrder(
			orderCreateData
		);

		console.log(createDelivery.data);

		// Send the response back to Shopify
		return res.status(200).send(delivery.data);
	} catch (error) {
		console.error("Error processing order:", error);
		return res.status(500).send({ error: "Internal Server Error" });
	}
});

app.post("/shopify/webhook/carrier", async (req, res, next) => {
	// const address = req.body.address;
	const currentDate = new Date();

	// Calculate min_delivery_date (1 day from today)
	const minDeliveryDate = new Date(currentDate);
	minDeliveryDate.setDate(currentDate.getDate() + 1);

	// Calculate max_delivery_date (7 days from today)
	const maxDeliveryDate = new Date(currentDate);
	maxDeliveryDate.setDate(currentDate.getDate() + 7);

	// Format the dates as YYYY-MM-DD
	const formattedMinDeliveryDate = minDeliveryDate.toISOString().split("T")[0];
	const formattedMaxDeliveryDate = maxDeliveryDate.toISOString().split("T")[0];

	const shippingRates = [
		{
			service_name: "Gdelivery",
			service_code: "GDELIVER",
			total_price: 10, // price in cents (e.g., 1000 cents = $10)
			currency: "NGN",
			min_delivery_date: formattedMinDeliveryDate,
			max_delivery_date: formattedMaxDeliveryDate,
		},
	];
	const street = req.body.rate.destination.address1;
	const city = req.body.rate.destination.city;
	const province = req.body.rate.destination.province;
	const address = `${street} ${city} ${province}`;
	console.log(address);
	const geocodeResponse = await googleIntegration.getGeocoding(address, next);

	if (geocodeResponse.status === 400) {
		console.log("no address found");
		return res.status(400).json({ error: "no address found" });
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

		if (delivery.result === false || delivery.result === undefined) {
			console.log(">>>>>>>>>>>>>>>>>>>.");
			console.log("fail");
			return res.status(400).send();
		}
		console.log(">>>>>>>>>>>>>>>>>>>");
		console.log("delivery");
		console.log(delivery);
		shippingRates[0].total_price = delivery.response.data.delivery_amount;
		console.log(shippingRates[0]);

		// Send the response back to Shopify
		res.json({ rates: shippingRates });
		return;
	} catch (error) {
		console.error("Error processing order:", error);
		return res.status(500).send({ error: "Internal Server Error" });
	}
});

// app.post("/shopify/webhook/carrier", async (req, res) => {
// 	const address = req.body.rate.destination.address1;
// 	const geocodeResponse = await googleIntegration.getGeocoding(address, next);

// 	const currentDate = new Date();

// 	// Calculate min_delivery_date (1 day from today)
// 	const minDeliveryDate = new Date(currentDate);
// 	minDeliveryDate.setDate(currentDate.getDate() + 1);

// 	// Calculate max_delivery_date (7 days from today)
// 	const maxDeliveryDate = new Date(currentDate);
// 	maxDeliveryDate.setDate(currentDate.getDate() + 7);

// 	// Format the dates as YYYY-MM-DD
// 	const formattedMinDeliveryDate = minDeliveryDate.toISOString().split("T")[0];
// 	const formattedMaxDeliveryDate = maxDeliveryDate.toISOString().split("T")[0];
// 	const shippingRates = [
// 		{
// 			service_name: "Gdelivery",
// 			service_code: "CHOWDEX",
// 			total_price: 10, // price in cents (e.g., 1000 cents = $10)
// 			currency: "NGN",
// 			min_delivery_date: formattedMinDeliveryDate,
// 			max_delivery_date: formattedMaxDeliveryDate,
// 		},
// 	];

// 	// Send rates back to Shopify
// 	res.json({ rates: shippingRates });
// });
app.post("/extensions", async (req, res) => {
	const shippingRates = [
		{
			service_name: "Gdelivery",
			service_code: "CHOWDEX",
			total_price: 10, // price in cents (e.g., 1000 cents = $10)
			currency: "NGN",
			min_delivery_date: "2024-12-01",
			max_delivery_date: "2024-12-03",
		},
	];

	// Send rates back to Shopify
	res.json({ rates: shippingRates });
});
app.get("/update-carrier", async (req, res) => {
	const response = shopifyIntegration.updateCarrierService(
		"62191665239",
		" https://gdeliver-main-60ft.onrender.com/shopify/webhook/carrier"
	);
	return res.status(200).json(response);
});

app.get("/register", async (req, res) => {
	const response = await shopifyIntegration.registerCarrierService();
	return res.status(200).json(response);
});

// GOOGLE ROUTES

app.post("/google/geocode", async (req, res) => {
	const address = req.body.address;
	console.log("address", address);
	if (!address) {
		console.log("Bad Request, missing address variable");
		return res
			.status(400)
			.json({ ERROR: "Bad Request, missing address variable" });
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
