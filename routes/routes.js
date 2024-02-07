const controller = require("../controllers/controller")
const express = require("express");
const router = express.Router();
const { whiteListMethods, checkPayload } = controller.checks;
const authenticate = controller.authenticate

router.all("/healthz", whiteListMethods, checkPayload, controller.userManagement.healthcheck)
router.post("/v1/user", controller.userManagement.createUser)
router.put("/v1/user/self", authenticate, controller.userManagement.updateUser)
router.get("/v1/user/self", authenticate, controller.userManagement.getUser)

module.exports = router