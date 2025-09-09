#!/bin/bash

echo "🧪 Testing @flow with OpenAI GPT-4o"
echo "======================================"
echo ""

# Get auth token (you may need to login first)
TOKEN=$(cat ~/.anythingllm-auth 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "⚠️  No auth token found. Testing without auth..."
fi

# Test message
MESSAGE="@flow create automated workflow to send daily weather reports via email"

echo "📝 Sending: \"$MESSAGE\""
echo ""

# Send the request
curl -X POST http://localhost:3001/api/workspace/segev/stream-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"message\": \"$MESSAGE\",
    \"mode\": \"chat\"
  }" \
  --no-buffer 2>/dev/null | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      # Extract JSON from SSE
      json="${line:5}"
      if [[ ! -z "$json" && "$json" != "[DONE]" ]]; then
        # Parse and display relevant info
        echo "$json" | jq -r '.textResponse // .type // empty' 2>/dev/null
      fi
    fi
done

echo ""
echo "✅ Test complete!"