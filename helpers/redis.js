const sleep = require("await-sleep");
const redis = require("redis");
const asyncRedis = require("async-redis");

const config = require("../config");

const client = redis.createClient(config.redisData);
const redClient = asyncRedis.decorate(client);

client.on("error", (err) => {
  console.log(`Redis Error: ${err}.`);
});

redClient.on("error", (err) => {
  console.log(`Redis Error: ${err}.`);
});

redClient.on("connect", () => {
  console.log(
    `Redis client [connected] is running on ${config.redisData.host}:${config.redisData.port}/${config.redisData.db}`
  );
});

const redisIsOk = async () => {
  if (redClient.connected) return;

  let counter = 0;
  do {
    counter += 1;
    if (redClient.connected) {
      return redClient.connected;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(500);
  } while (counter < 100);

  return redClient.connected;
};

const getFrequentWithdrawal = async (user, currency) => {
  await redisIsOk();

  const fw = await redClient.get(`fw_${user}_${currency}`);
  return !!fw;
};

const setFrequentWithdrawal = async (user, currency) => {
  await redisIsOk();

  await redClient.set(
    `fw_${user}_${currency}`,
    "true",
    "EX",
    config.withdrawFrequencySeconds
  );

  return true;
};

const setLastRoundId = async (lastRoundId) => {
  await redisIsOk();

  await redClient.set(`lastRoundId`, lastRoundId);
  return true;
};

const getLastRoundId = async () => {
  await redisIsOk();

  const lastRoundId = await redClient.get(`lastRoundId`);
  return lastRoundId;
};

const setRing = async (lastRoundId) => {
  await redisIsOk();

  await redClient.set(`lastRoundId`, lastRoundId);
  return true;
};

const getRing = async () => {
  await redisIsOk();

  const lastRoundId = await redClient.get(`lastRoundId`);
  return lastRoundId;
};

const setFrequentBet = async (user) => {
  await redisIsOk();

  await redClient.set(`bet_${user}`, "true", "EX", config.betFrequencySeconds);
  return true;
};

const getFrequentBet = async (user) => {
  await redisIsOk();

  const bet = await redClient.get(`bet_${user}`);
  return !!bet;
};

const setBongoRequest = async (request) => {
  await redisIsOk();

  await redClient.set(
    `bongo_${request.uid}`,
    JSON.stringify(request),
    "EX",
    config.bongoRequestExpireSeconds
  );
  return true;
};

const getBongoRequest = async (uid) => {
  await redisIsOk();

  const resp = await redClient.get(`bongo_${uid}`);
  return resp ? JSON.parse(resp) : null;
};

module.exports = {
  redisIsOk,
  getFrequentWithdrawal,
  setFrequentWithdrawal,
  setLastRoundId,
  getLastRoundId,
  setFrequentBet,
  getFrequentBet,
  setBongoRequest,
  getBongoRequest,
};
