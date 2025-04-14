#!/bin/bash

echo "Checking if services are available..."

# Function to check if a service is ready
check_service() {
  local url=$1
  local name=$2
  local max_retries=10
  local retry_count=0
  
  echo "Checking $name at $url..."
  
  while [ $retry_count -lt $max_retries ]; do
    if curl -k -s -o /dev/null -w "%{http_code}" $url | grep -q "200\|301\|302"; then
      echo "✅ $name is available"
      return 0
    else
      retry_count=$((retry_count+1))
      echo "⏳ $name not ready yet. Retry $retry_count of $max_retries..."
      sleep 5
    fi
  done
  
  echo "❌ $name is not available after $max_retries retries"
  return 1
}

# Check database using the backend health endpoint
check_service "https://localhost:8080/api/health" "Backend API"
backend_status=$?

# Check video backend
check_service "https://localhost:8081/api/room/health" "Video Backend API"
video_status=$?

# Check frontend
check_service "https://localhost" "Frontend"
frontend_status=$?

echo ""
echo "Service Status Summary:"
echo "======================="

if [ $backend_status -eq 0 ]; then
  echo "✅ Backend API: Available"
else
  echo "❌ Backend API: Not Available"
fi

if [ $video_status -eq 0 ]; then
  echo "✅ Video Backend API: Available"
else
  echo "❌ Video Backend API: Not Available"
fi

if [ $frontend_status -eq 0 ]; then
  echo "✅ Frontend: Available"
else
  echo "❌ Frontend: Not Available"
fi

echo ""
if [ $backend_status -eq 0 ] && [ $video_status -eq 0 ] && [ $frontend_status -eq 0 ]; then
  echo "🎉 All services are available! You can access the application at https://localhost"
  exit 0
else
  echo "⚠️ Some services are not available. Please check the Docker logs:"
  echo "docker-compose logs"
  exit 1
fi 