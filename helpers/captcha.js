const axios = require("axios");

const config = require("../config");

const doRecaptcha = async (recaptcha, ip) => {
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${config.captchaSecretKey}&response=${recaptcha}&remoteip=${ip}`;

  try {
    const response = await axios.post(verificationUrl);
    return response.data.success;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  doRecaptcha,
};
