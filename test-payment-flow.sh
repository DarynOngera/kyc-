#!/bin/bash
# Test M-Pesa Payment Flow with Simulated Callback

echo "🧪 Testing M-Pesa Payment Flow"
echo "================================"
echo ""

# Step 1: Initiate payment (you'll need to do this manually from the UI)
echo "📱 Step 1: Initiate a payment from your checkout page"
echo "   The transaction will be created with status 'initiated'"
echo ""
read -p "Enter the CheckoutRequestID from the logs: " CHECKOUT_ID

if [ -z "$CHECKOUT_ID" ]; then
    echo "❌ CheckoutRequestID is required"
    exit 1
fi

# Step 2: Simulate successful callback
echo ""
echo "✅ Step 2: Simulating M-Pesa callback..."

# Create temporary callback JSON
cat > /tmp/callback-test.json <<EOF
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "test-merchant-$(date +%s)",
      "CheckoutRequestID": "$CHECKOUT_ID",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 5199},
          {"Name": "MpesaReceiptNumber", "Value": "TEST$(date +%s)"},
          {"Name": "PhoneNumber", "Value": 254757238817},
          {"Name": "TransactionDate", "Value": $(date +%Y%m%d%H%M%S)}
        ]
      }
    }
  }
}
EOF

# Send callback
curl -X POST http://localhost:8888/.netlify/functions/mpesa-callback \
  -H "Content-Type: application/json" \
  -d @/tmp/callback-test.json

echo ""
echo ""
echo "✅ Callback sent!"
echo ""

# Step 3: Check transaction status
echo "📊 Step 3: Checking transaction status..."
sleep 2

curl -s "http://localhost:8888/.netlify/functions/transaction-status?checkoutRequestId=$CHECKOUT_ID" | jq .

echo ""
echo "================================"
echo "✅ Test complete!"
echo ""
echo "Check your Supabase dashboard to see the updated transaction."
