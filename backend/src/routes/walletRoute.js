/**
 * Wallet API routes. POST /api/wallet/fetch derives addresses for a given currency and input.
 */
const { Router } = require("express");
const { fetchData } = require("../controllers/walletController.js");

const router = Router();

router.post("/fetch", fetchData);

module.exports = router;
