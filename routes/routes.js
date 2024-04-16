const controller = require("../controllers/controller")
const express = require("express");
const router = express.Router();
const { whiteListMethods, checkPayload, verifyUser } = controller.checks;
const authenticate = controller.authenticate

router.all("/healthz", whiteListMethods, checkPayload, controller.userManagement.healthcheck)
router.post("/v2/user", controller.userManagement.createUser)
router.put("/v2/user/self", authenticate, verifyUser, controller.userManagement.updateUser)
router.get("/v2/user/self", authenticate, verifyUser, controller.userManagement.getUser)
router.get("/verify", controller.userManagement.verifyEmail)

module.exports = router