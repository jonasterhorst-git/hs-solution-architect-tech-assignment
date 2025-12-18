### A. Setup Instructions

How to run the application locally

This project consists of a lightweight backend that integrates with HubSpot and a frontend React-based UI.

1. Clone the repository
2. Install backend dependencies
	npm install
3. Start the backend server
	npm start
- The server runs on:
	http://localhost:3001
4. Run the frontend
- Open index.html directly in a browser


Dependencies / Prerequisites

- Node.js (v18+ recommended)
- npm
- HubSpot developer account
- HubSpot Private App access token
- Expected Environment Variables

The backend expects the following environment variable:
	HUBSPOT_ACCESS_TOKEN=your_private_app_token_here
This token is used to authenticate all HubSpot API requests.

How to test the integration flow
1. Start the backend server
2. Open the frontend UI
3. Click Fetch Contacts to load existing HubSpot contacts
4. Use Create Contact (Simulate Purchase) to create a new contact in HubSpot
5. Use Create Deal (Subscription Conversion) to:
- Create a deal
- Associate it with an existing contact
6. Click View Deals on a contact to verify deal association

Successful execution confirms:
- Contact creation
- Deal creation
- HubSpot associations working end-to-end



### B. Project Overview

This proof of concept demonstrates how Breezy could integrate its internal customer and subscription data with HubSpot CRM.

The POC focuses on:
- Modeling Breezy’s core business entities
- Mapping those entities to HubSpot objects
-  Synchronizing contacts and deals
-  Demonstrating how insights could be layered on top of CRM data

The goal is clarity of architecture and integration design — not production hardening.



### C. AI Usage Documentation
Which AI tools were used?
ChatGPT (OpenAI) & Gemini

What tasks was AI used for?
- Generating frontend UI scaffolding (React + CSS)
- Drafting the README documentation

What was challenging?
- Avoiding overengineering for a POC while still showing architectural depth

How did AI help (or not help)?
- It helped created a good looking and working UI. However, depending on the customer and the peer group this is presented to, the UI might already be too much for an initial poc
- AI was not used in the process of creating the ERD.



### D. HubSpot Data Architecture
Entity Relationship Diagram (ERD)

The following ERD represents Breezy’s internal data model and its relationship to HubSpot CRM.
The diagram below was created specifically for this POC and reflects intentional design decisions.
<img width="855" height="609" alt="image" src="https://github.com/user-attachments/assets/b016a4dd-5f26-44be-9ec3-6a63b8092701" />
THE PNG CAN BE FOUND IN THE PUBLIC FOLDER OF THE PROJECT. IT IS CALLED 'ERD Breezy'


Entity Descriptions

1. CUSTOMER
Represents a Breezy customer and maps directly to a HubSpot Contact.

Key attributes: customer_id (Primary Key)


2. SUBSCRIPTION
Represents a customer’s active or historical subscription.
Linked to CUSTOMER via customer_id
Generates a DEAL when a subscription is sold or converted
Modelled separately to allow future lifecycle events (upgrade, cancel, renew)

Key attributes: subscription_id (Primary Key), customer_id (Foreign Key)


3. DEAL
Represents a commercial transaction and maps directly to a HubSpot Deal.
Linked to CUSTOMER via customer_id
Linked to HARDWARE via hardware_id
Stores sales pipeline data such as stage and amount

Key attributes: deal_id (Primary Key), customer_id & hardware_id (Foreign Keys)


4. HARDWARE
Represents physical devices (e.g., thermostats).
Linked to DEAL via hardware_id
Included to support future expansion (multi-device households, upsells)
Not fully synced to HubSpot in this POC

Key attributes: hardware_id (Primary Key)


5. Deal Pipeline Architecture
- Deals progress through a standard HubSpot pipeline:
- Deal stages reflect subscription lifecycle events
- Deals are always associated with a Contact in HubSpot

This structure ensures:
- Clean reporting
- Accurate revenue attribution
- Expandability for renewals and upgrades



### E. [Optional] AI Feature Explanation

AI-powered feature (POC)

The POC includes a simple rule-based insight engine that flags potential expansion customers.
Example signals:
- Customers with multiple devices
- Customers with multiple subscriptions
- Heuristic indicators of higher household usage

Why this feature?
Expansion and upsell identification is a natural use case for CRM-driven intelligence and aligns well with Breezy’s business model.

When to use AI vs traditional rules?

Rules-based logic
- Deterministic
- Auditable
- Suitable for early-stage or regulated logic

AI-driven insights
- Pattern detection across large datasets
- Predictive modeling
- Best suited once sufficient historical data exists

In production, a hybrid approach would be recommended.



### F. Design Decisions

Technical choices
- React with CDN-based setup to avoid build complexity

Assumptions about Breezy’s platform
- Breezy maintains an internal customer and subscription system
- HubSpot is used primarily for marketing, and lifecycle tracking
- Hardware ownership is known internally but not yet modelled in HubSpot

What I’d improve with more time
- Pagination and search for large contact lists
- Stronger validation and retry logic
- Proper authentication layer for frontend users

Questions I’d ask before building a production version
- Is HubSpot the long-term system of record for subscriptions?
- What is Hubspot supposed to do in the end? Data analytics? Marketing automation? 
- Should hardware be modelled as a HubSpot custom object?
- What about B2B processes?
- How should renewals and upgrades be represented?
- Are there compliance or audit requirements?
