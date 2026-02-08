const express = require("express");
const router = express.Router();

//  User Controllers
const usersigninController = require("../controller/user/userSignin");
const userLoginController = require("../controller/user/userLogin");
const authToken = require("../middleware/authToken");
const userDetailsController = require("../controller/user/userDetails");
const allUserController = require("../controller/user/allUser");
const updateAllUserController = require("../controller/user/updateALluser");
const useLogout = require("../controller/user/useLogOut"); //  Add this if you have logout controller

const addTocartController = require("../controller/user/addTocartController")

//  Product Controllers
const productData = require("../controller/product/productDataController");
const getAllProduct = require("../controller/product/getAllproduct");
const deleteProduct = require("../controller/product/deleteProduct");
const getCategoryProduct = require("../controller/product/getCatogoryProduct");
const { sendOtpController, verifyOtpController, resendOtpController } = require("../controller/user/otpController");
const googleAuthController = require("../controller/user/googleAuth");

const getCategoryWiseProduct = require("../controller/product/getCategoryWiseProduct");
const countAddToCartProduct = require("../controller/user/countAddToCart");
const searchProduct = require("../controller/product/searchProduct");
const getProductById = require("../controller/product/getProductById");



// --------------------------- USER ROUTES ---------------------------

router.post("/signup", usersigninController);
router.post("/signin", userLoginController);

router.get("/user-details", authToken, userDetailsController);
router.get("/userLogout", useLogout);

/// OTP ROUTES

router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/resend-otp", resendOtpController);

// Google Auth
router.post("/google-auth", googleAuthController);


// --------------------------- ADMIN ROUTES ---------------------------

router.get("/all-user", authToken, allUserController);
router.post("/update-alluser", authToken, updateAllUserController);
router.post("/uploadProduct", authToken, productData);
router.get("/get-product", getAllProduct);
router.delete("/delete-product/:id", deleteProduct);
router.get("/getCatogeryData", getCategoryProduct); 
router.post("/category-product" ,getCategoryWiseProduct)


// user Add to Cart 
router.post("/addtocart" ,authToken,addTocartController)
router.get("/countAddToProduct" ,authToken,countAddToCartProduct)
router.get("/search",searchProduct)
router.get("/product-details/:id", getProductById);

module.exports = router;
