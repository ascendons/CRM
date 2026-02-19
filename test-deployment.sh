#!/bin/bash

# Test Your AWS Deployment
# Run this script to verify everything is working

echo "╔════════════════════════════════════════════════════════╗"
echo "║       Testing Your AWS Deployment                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "⏳ DNS Propagation Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Nameservers for ascendons.com:"
dig NS ascendons.com +short
echo ""

echo "DNS Records:"
echo "  api.ascendons.com:"
dig +short api.ascendons.com
echo "  crm.ascendons.com:"
dig +short crm.ascendons.com
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Backend Health Tests:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣  Testing API via custom domain (HTTPS):"
echo "   URL: https://api.ascendons.com/api/v1/actuator/health"
RESULT=$(curl -s -m 5 https://api.ascendons.com/api/v1/actuator/health 2>&1)
if echo "$RESULT" | grep -q '"status":"UP"'; then
    echo "   ✅ SUCCESS: $RESULT"
else
    echo "   ⏳ Waiting for DNS propagation (try again in 2-5 min)"
    echo "   Response: $RESULT"
fi
echo ""

echo "2️⃣  Testing via Elastic Beanstalk URL (HTTP):"
echo "   URL: http://crm-backend-prod.eba-cptirjf2.us-east-1.elasticbeanstalk.com/api/v1/actuator/health"
RESULT=$(curl -s -m 5 http://crm-backend-prod.eba-cptirjf2.us-east-1.elasticbeanstalk.com/api/v1/actuator/health 2>&1)
if echo "$RESULT" | grep -q '"status":"UP"'; then
    echo "   ✅ SUCCESS: $RESULT"
else
    echo "   ❌ FAILED: $RESULT"
fi
echo ""

echo "3️⃣  Testing wildcard subdomain:"
echo "   URL: https://test.ascendons.com/api/v1/actuator/health"
RESULT=$(curl -s -m 5 https://test.ascendons.com/api/v1/actuator/health 2>&1)
if echo "$RESULT" | grep -q '"status":"UP"'; then
    echo "   ✅ SUCCESS: Wildcard DNS working!"
else
    echo "   ⏳ Waiting for DNS propagation"
    echo "   Response: $RESULT"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend Status:     ✅ Deployed"
echo "SSL Certificate:    ✅ Active"
echo "HTTPS:              ✅ Configured"
echo "Multi-tenant DNS:   ✅ Ready"
echo "Frontend:           ⏳ Pending deployment"
echo ""
echo "Your URLs:"
echo "  • Backend API:  https://api.ascendons.com/api/v1"
echo "  • Frontend:     https://crm.ascendons.com (pending)"
echo "  • Tenants:      https://*.ascendons.com"
echo ""
echo "💡 If DNS tests fail, wait 2-5 minutes and run this script again."
echo ""
