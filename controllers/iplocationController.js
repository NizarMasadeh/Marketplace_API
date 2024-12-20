const axios = require('axios');

const getIPLocation = async (req, res) => {
  try {
    const ipResponse = await axios.get('https://api.ipify.org?format=json');
    const ip = ipResponse.data.ip;

    const locationResponse = await axios.get(`http://ip-api.com/json/${ip}`);

    const result = {
      ip: ip,
      location: locationResponse.data
    };

    const detailLocationResponse = await axios.get(`http://ipwho.is/${ip}`);

    const finalRes = {
      ip: ip,
      location: locationResponse.data,
      detailedLocation: detailLocationResponse.data,
    };


    res.json(finalRes);
  } catch (error) {
    console.error('Error fetching IP location:', error);
    res.status(500).json({
      error: 'Failed to fetch IP location',
      details: error.message
    });
  }
};

module.exports = {
  getIPLocation
};