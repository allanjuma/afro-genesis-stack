
#!/bin/bash

# Send SMS for address validation

send_sms_validation() {
    local phone_number=$1
    local validation_code=$2
    local otp=$(echo -n "$validation_code" | sha256sum | cut -c1-6)

    echo "Sending SMS validation to: ${phone_number}"
    echo "Validation code: ${validation_code}"
    echo "OTP: ${otp}"

    # Send SMS via API (mock implementation)
    curl -X POST "$AFRO_SMS_API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"to\": \"${phone_number}\",
            \"message\": \"Your Afro address validation code: ${otp}. Extra chars: ${validation_code}\",
            \"type\": \"address_validation\"
        }" \
        --timeout "$AFRO_SMS_TIMEOUT" || echo "SMS sending failed (API not available)"
}
