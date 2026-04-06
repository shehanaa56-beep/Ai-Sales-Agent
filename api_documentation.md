# API Documentation & Testing Guide

This document provides detailed instructions for testing the **AI Sales Agent SaaS** platform at every level (WhatsApp Webhook, RAG, Buy Flow, and Broadcasts).

---

## 1. WhatsApp Webhook (POST)
This is the heart of the system. It receives messages from the AOC Portal (Bot API) and triggers the AI response.

- **Emulator URL**: `http://localhost:5001/[project-id]/us-central1/whatsappWebhook`
- **Production URL**: `https://us-central1-[project-id].cloudfunctions.net/whatsappWebhook`

### Sample Postman Payload
Set the body to `raw` -> `JSON`.

```json
{
  "to": "919633859929",
  "contacts": [
    {
      "wa_id": "919037258541",
      "profile": { "name": "John Doe" }
    }
  ],
  "messages": [
    {
      "from": "919037258541",
      "id": "message_id_123",
      "text": { "body": "I want to buy the Blue Silk Kurta" },
      "type": "text"
    }
  ]
}
```

> [!NOTE]
> **Company Lookup**: The system identifies which company to use by looking up the `whatsapp_number` in the `companies` collection. Ensure you have a company record with a number that matches the recipient (or just use `company_test_001` as a default).

---

## 2. Multi-tenant Broadcast API (POST)
Used to send manual or semi-automated broadcasts to a list of leads.

- **Endpoint**: `/broadcastMessage`

### Sample Postman Payload
```json
{
  "companyId": "company_test_001",
  "phones": ["919037258541", "919876543210"],
  "message": "Hello! We have a special offer for you today! 🎁"
}
```

---

## 3. Firestore Collection Reference

| Collection | Description | Key Fields |
| :--- | :--- | :--- |
| `companies` | Tenant settings | `name`, `whatsapp_number`, `api_key`, `api_url`, `system_prompt` |
| `leads` | CRM records | `phone`, `companyId`, `status` (new/warm/customer), `name` |
| `orders` | Sales records | `customer_phone`, `product`, `amount`, `status`, `companyId` |
| `products` | Catalog | `name`, `price`, `description`, `companyId` |
| `knowledge` | RAG snippets | (Subcollection: `companies/{id}/knowledge`) `title`, `content`, `tags` |
| `conversations` | Message logs | `phone`, `inbound`, `outbound`, `companyId`, `timestamp` |

---

## 4. End-to-End Testing Flows

### A. Testing the RAG (Knowledge)
1. **Firestore**: Add a document to `companies/company_test_001/knowledge` with:
   - title: `Shipping Policy`
   - content: `We offer free shipping on all orders over ₹2000.`
2. **Postman**: Send a message to the webhook: `"What is your shipping policy?"`
3. **Verify**: The AI response should mention the free shipping over ₹2000.

### B. Testing the Buy Flow (Commerce)
1. **Postman**: Send `"I want to buy the Premium Perfume"`
2. **AI Reply**: Should ask for your name.
3. **Postman**: Send `"My name is Arjun"`
4. **Verify**: The AI should confirm the order. Check the `orders` collection in Firestore—a new record should be created!

---

## 5. Deployment Checklist

- [x] **Firebase Functions**: Automated follow-ups (`onOrderCreated`) and Webhook logic are live.
- [x] **Admin Panel**: React Dashboard is multi-tenant and uses global Context.
- [x] **RAG**: Connected to both Knowledge subcollections and Product catalog.
- [x] **State Management**: Lead tracking and status upgrades are fully automated.

> [!TIP]
> **API Security**: In production, ensure your `verifyWebhook` logic is enabled in `aiController.js` to protect your functions from unauthorized POST requests.
