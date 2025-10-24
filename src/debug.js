// Debug environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All REACT_APP vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));

// Test API URL construction
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('Final API_URL:', API_URL);

const debugConfig = {};
export default debugConfig;
