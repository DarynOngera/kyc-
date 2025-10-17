#!/bin/bash
# Simulate complete payment flow for sandbox testing

echo "🧪 Simulating M-Pesa Payment Flow"
echo "=================================="
echo ""

# Step 1: Initiate payment (you do this from the UI)
echo "📱 Step 1: Initiate payment from checkout page"
echo "   Go to: http://localhost:8888/checkout.html"
echo "   Click 'Pay with M-Pesa'"
echo ""
read -p "After initiating payment, paste the CheckoutRequestID: " CHECKOUT_ID

if [ -z "$CHECKOUT_ID" ]; then
    echo "❌ CheckoutRequestID is required"
    exit 1
fi

echo ""
echo "✅ Step 2: Simulating M-Pesa callback (since sandbox doesn't send prompts)..."
echo ""

# Create callback payload
cat > /tmp/payment-callback.json <<EOF
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
  -d @/tmp/payment-callback.json

echo ""
echo ""
echo "✅ Step 3: Checking transaction status..."
sleep 2

curl -s "http://localhost:8888/.netlify/functions/transaction-status?checkoutRequestId=$CHECKOUT_ID" | jq .

echo ""
echo "=================================="
echo "✅ Payment flow simulation complete!"
echo ""
echo "Check:"
echo "  1. Supabase dashboard - transaction should be 'completed'"
echo "  2. Your email - should have received receipt"
echo "  3. Admin email - should have received notification"
echo ""
