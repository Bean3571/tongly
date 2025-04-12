/**
 * Service Health Checker for Tongly Application
 * Checks if all required services are up and running
 */

const https = require('https');
const process = require('process');

// Disable SSL verification (for local development only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const services = [
  { name: 'PeerJS Server', url: 'https://192.168.0.100:9001/health' },
  { name: 'Socket.IO Server', url: 'https://192.168.0.100:8000/health' },
  { name: 'Frontend', url: 'https://192.168.0.100:3000' }
];

async function checkService(service) {
  return new Promise((resolve) => {
    console.log(`Checking ${service.name}...`);
    
    const req = https.get(service.url, (res) => {
      console.log(`${service.name}: ${res.statusCode} ${res.statusMessage}`);
      resolve({
        name: service.name,
        status: res.statusCode >= 200 && res.statusCode < 300 ? 'UP' : 'DOWN',
        statusCode: res.statusCode
      });
    });
    
    req.on('error', (error) => {
      console.error(`${service.name} error: ${error.message}`);
      resolve({
        name: service.name,
        status: 'DOWN',
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      console.error(`${service.name} timeout`);
      resolve({
        name: service.name,
        status: 'DOWN',
        error: 'Request timeout'
      });
    });
  });
}

async function checkAllServices() {
  console.log('Starting health check for all Tongly services...\n');
  
  const results = await Promise.all(services.map(checkService));
  
  console.log('\nHealth check results:');
  console.log('===================');
  
  let allServicesUp = true;
  
  results.forEach(result => {
    console.log(`${result.name}: ${result.status}${result.error ? ` (${result.error})` : ''}`);
    if (result.status !== 'UP') {
      allServicesUp = false;
    }
  });
  
  console.log('\nOverall status:', allServicesUp ? 'All services are UP' : 'Some services are DOWN');
  
  if (!allServicesUp) {
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure all services are started (run start-services.bat or start-services.sh)');
    console.log('2. Check if the correct ports are free (8000, 9001, 3000)');
    console.log('3. Verify SSL certificates exist in the certs directory');
    console.log('4. Check if your firewall is blocking any of the ports');
  }
  
  return allServicesUp;
}

checkAllServices().then(status => {
  console.log('\nHealth check completed.');
}); 