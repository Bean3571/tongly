# Tongly Project

## Docker Deployment Instructions

This project consists of three main components:
- Frontend (React)
- Backend (Go)
- Video Backend (Go)
- PostgreSQL Database

All components are containerized using Docker and orchestrated with Docker Compose.

### Prerequisites

1. Docker and Docker Compose installed on your host machine
2. SSL certificates in the `certs/` directory:
   - `cert.pem` - SSL certificate
   - `key.pem` - SSL private key

### Quick Start

1. Make sure Docker and Docker Compose are installed on your system.

2. Place your SSL certificates in the `certs/` directory:
   ```
   certs/
   ├── cert.pem
   └── key.pem
   ```

3. Start all services:
   ```
   docker-compose up -d
   ```

4. Check if all services are running properly:
   ```
   docker-compose ps
   ```

5. Access the application:
   - Frontend: https://localhost
   - Main API: https://localhost:8080
   - Video API: https://localhost:8081

### Network Configuration

The Docker Compose setup creates a shared network (`tongly-network`) that allows all containers to communicate with each other. The services are referenced by their container names within the Docker network:

- `frontend` - Nginx serving the React app (port 443)
- `backend` - Go API service (port 8080)
- `video-service` - Go video communication service (port 8081)
- `db` - PostgreSQL database (port 5432)

### SSL Certificates

All services use the SSL certificates mounted from the host machine:

- The certificates are mounted as read-only volumes in each container
- The frontend serves HTTPS traffic on port 443
- The backend services use HTTPS for API communication

### Environment Variables

The Docker-specific configuration is managed through environment variables:

- Frontend uses `.env.docker` during build which sets service URLs to container names
- Backend and video-service container environment variables are set in docker-compose.yml

### Healthchecks

The docker-compose.yml includes healthchecks for each service:

- **Database**: Uses `pg_isready` to ensure the database is accepting connections
- **Backend**: Checks the `/api/health` endpoint
- **Video Backend**: Checks the `/api/room/health` endpoint

These ensure that each service starts only when its dependencies are actually ready.

### Persistent Data

The following Docker volumes are created for persistent data:

- `postgres-data`: Stores PostgreSQL database files
- `backend-uploads`: Stores uploaded files for the backend service

### Troubleshooting

1. Check service status:
   ```
   docker-compose ps
   ```

2. View logs for a specific service:
   ```
   docker-compose logs -f [service-name]
   ```

3. If services can't communicate, check that:
   - The container names are being used for inter-service communication
   - The Docker network is properly created
   - All services are on the same network

4. For SSL certificate issues:
   - Ensure the certificates are correctly mounted in each container
   - Check the logs for certificate path errors:
     ```
     docker-compose logs backend | grep cert
     docker-compose logs video-service | grep cert
     ```
   - Verify the certificates are valid and properly formatted

5. Check CORS issues:
   - If you see CORS errors in your browser console, check that the domains match the allowed origins in both backend services
   - The CORS configurations allow various combinations of frontend URLs

6. For WebSocket connection issues:
   - Ensure the `Upgrade` and `Connection` headers are being properly passed
   - Check the nginx.conf proxy settings for WebSocket support

7. If frontend can't connect to backend services:
   - Check that the Docker network is working properly
   - Verify that the .env.docker file has the correct service URLs (using container names)
   - Try connecting directly to the backends (https://localhost:8080, https://localhost:8081)

### Restarting Services

If you need to restart a service:

```
docker-compose restart [service-name]
```

To rebuild a service after code changes:

```
docker-compose up -d --build [service-name]
```

### Security Notes

Production considerations:
- Replace the default passwords and JWT secrets with strong, unique values
- Consider using Docker secrets for sensitive information
- Set up proper firewall rules on your host machine
- Implement proper backup procedures for volumes
- Consider using a reverse proxy (like Traefik or Nginx Proxy Manager) for managing SSL and routing 