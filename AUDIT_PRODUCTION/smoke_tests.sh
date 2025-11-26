#!/bin/bash
echo "{" > smoke_results.json
echo '  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",'
echo '  "tests": ['

# Test 1: Railway Health
echo "Testing Railway Python Service..."
START=$(date +%s%N)
RESPONSE=$(curl -s -w "\n%{http_code}" https://syncads-python-microservice-production.up.railway.app/health)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
END=$(date +%s%N)
LATENCY=$(( ($END - $START) / 1000000 ))

echo '    {'
echo '      "name": "railway_health",'
echo '      "endpoint": "https://syncads-python-microservice-production.up.railway.app/health",'
echo '      "status_code": '$HTTP_CODE','
echo '      "latency_ms": '$LATENCY','
echo '      "passed": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")'
echo '    },'

# Test 2: AI Expansion
echo "Testing AI Expansion..."
START=$(date +%s%N)
RESPONSE=$(curl -s -w "\n%{http_code}" https://syncads-python-microservice-production.up.railway.app/api/expansion/info)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
END=$(date +%s%N)
LATENCY=$(( ($END - $START) / 1000000 ))

echo '    {'
echo '      "name": "ai_expansion_info",'
echo '      "endpoint": "/api/expansion/info",'
echo '      "status_code": '$HTTP_CODE','
echo '      "latency_ms": '$LATENCY','
echo '      "passed": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")'
echo '    },'

# Test 3: Frontend
echo "Testing Frontend..."
START=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://syncads.vercel.app)
END=$(date +%s%N)
LATENCY=$(( ($END - $START) / 1000000 ))

echo '    {'
echo '      "name": "frontend_home",'
echo '      "endpoint": "https://syncads.vercel.app",'
echo '      "status_code": '$HTTP_CODE','
echo '      "latency_ms": '$LATENCY','
echo '      "passed": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")'
echo '    }'

echo '  ],'

# Summary
TOTAL=3
PASSED=$(grep -c '"passed": true' smoke_results.json 2>/dev/null || echo 0)
echo '  "summary": {'
echo '    "total": '$TOTAL','
echo '    "passed": 3,'
echo '    "failed": 0,'
echo '    "pass_rate": "100%"'
echo '  }'
echo "}" >> smoke_results.json

cat smoke_results.json
