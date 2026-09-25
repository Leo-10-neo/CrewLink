const axios = require('axios');
axios.post('http://localhost:5000/api/auth/register', {
  username: 'don',
  email: 'don@gmail.com',
  password: 'don123',
  role: 'volunteer'
}).then(res => {
  console.log("Created don@gmail.com");
}).catch(err => {
  console.log("Error:", err.response ? err.response.data : err.message);
});
