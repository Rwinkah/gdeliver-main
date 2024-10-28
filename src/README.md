# GDeliver Documentation

## Overview
GDeliver is a delivery management system that integrates with ClickNShip and Chowdeck APIs to facilitate quick and regular deliveries. The application allows users to manage delivery requests, track orders, and calculate delivery fees.

## Technologies
- JavaScript
- Node.js
- Express.js
- Fetch API

## Features
- Quick deliveries using Chowdeck API
- Track deliveries using Chowdeck API
- Regular deliveries using Click & Ship API
- Outside Lagos deliveries using Click & Ship API

## Installation
To run the APIs locally, follow these steps:

1. Clone the repository.
2. Run `npm install` to install the dependencies.
3. Set up a `.env` file using the `.env.example` file as a guide.
4. Run `npm run dev` to start the server in development mode.

## Environment Variables
The application requires the following environment variables to be set in the `.env` file:

```
## API Endpoints

### ClickNShip Endpoints

1. **Get Available States**
   - **Endpoint:** `GET /clicknship/states`
   - **Description:** Retrieves a list of available states for shipping.
   - **Response:** JSON object containing the list of states.

2. **Get Available Cities in a State**
   - **Endpoint:** `GET /clicknship/cities/:stateName`
   - **Description:** Retrieves a list of cities in a specified state.
   - **Parameters:**
     - `stateName`: Name of the state.
   - **Response:** JSON object containing the list of cities.

3. **Get Available Towns in a City**
   - **Endpoint:** `GET /clicknship/towns/:cityCode`
   - **Description:** Retrieves a list of towns in a specified city.
   - **Parameters:**
     - `cityCode`: Code of the city.
   - **Response:** JSON object containing the list of towns.

4. **Create Delivery Fee**
   - **Endpoint:** `POST /clicknship/delivery-fee`
   - **Description:** Calculates the delivery fee between two locations.
   - **Request Body:**
     ```json
     {
       "originCity": "string",
       "destinationCity": "string",
       "weight": "number"
     }
     ```
   - **Response:** JSON object containing the delivery fee details.

5. **Place Pickup Request**
   - **Endpoint:** `POST /clicknship/pickup-request`
   - **Description:** Places a pickup request for a delivery.
   - **Request Body:**
     ```json
     {
       "orderDetails": {
         "description": "string",
         "Weight": "number",
         "items": "array"
       },
       "senderDetails": {
         "name": "string",
         "city": "string",
         "townID": "string",
         "address": "string",
         "phone": "string",
         "email": "string"
       },
       "recipientDetails": {
         "name": "string",
         "city": "string",
         "townID": "string",
         "address": "string",
         "phone": "string",
         "email": "string"
       }
     }
     ```
   - **Response:** JSON object containing the pickup request details.

### Chowdeck Endpoints

1. **Create Delivery Fee**
   - **Endpoint:** `POST /chowdeck/delivery-fee`
   - **Description:** Calculates the delivery fee between two addresses.
   - **Request Body:**
     ```json
     {
       "sourceAddress": "string",
       "destinationAddress": "string"
     }
     ```
   - **Response:** JSON object containing the delivery fee details.

2. **Create Delivery Order**
   - **Endpoint:** `POST /chowdeck/delivery-order`
   - **Description:** Creates a delivery order.
   - **Request Body:**
     ```json
     {
       "sourceContact": {
         "name": "string",
         "phone": "string",
         "phone_country_code": "string",
         "email": "string"
       },
       "destinationContact": {
         "name": "string",
         "phone": "string",
         "phone_country_code": "string",
         "email": "string"
       },
       "feeId": "string",
       "itemType": "string"
     }
     ```
   - **Response:** JSON object containing the order details.

3. **Track Delivery Order**
   - **Endpoint:** `GET /chowdeck/track/:orderId`
   - **Description:** Tracks the status of a delivery order.
   - **Parameters:**
     - `orderId`: ID of the order to track.
   - **Response:** JSON object containing the order status.

## Error Handling
The application handles errors by returning a JSON response with a status code of 500 and an error message. For example:
```json
{
  "error": "Error message"
}
```

## Conclusion
GDeliver provides a robust solution for managing deliveries through integration with ClickNShip and Chowdeck APIs. The application is designed to be easily extendable and maintainable, allowing for future enhancements and features.