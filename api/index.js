const express = require("express");
const router = express.Router();
const { check: auth } = require("./authentication");
const {
  getUser,
  getCurrentBalance,
  getAvailableSubscriptions,
  getCurrentSubscription,
  enter,
  recharge,
  subscribeChannelPacks,
  addChannelsToExistingSubscription,
  subscribeToSpecialService,
  updateProfile,
} = require("./controller");

router.get("/user", auth, getUser);
router.get("/balance", auth, getCurrentBalance);
router.get("/subscriptions", getAvailableSubscriptions);
router.get("/subscription", auth, getCurrentSubscription);

router.post("/enter", enter);
router.post("/recharge", auth, recharge);
router.post("/subscribePack", auth, subscribeChannelPacks);
router.post("/addChannels", auth, addChannelsToExistingSubscription);
router.post("/subscribeService", auth, subscribeToSpecialService);

router.put("/user", auth, updateProfile);

module.exports = router;
