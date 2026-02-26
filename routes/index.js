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
const getCartProducts = require("../controller/user/getCartProducts")
const updateCartProduct = require("../controller/user/updateCartProduct")
const deleteCartProduct = require("../controller/user/deleteCartProduct")

// Settings Controllers
const getSiteSettings = require("../controller/settings/getSiteSettings")
const updateSiteSettings = require("../controller/settings/updateSiteSettings")

// Category Controllers
const createCategory = require("../controller/category/createCategory")
const getAllCategories = require("../controller/category/getAllCategories")
const updateCategory = require("../controller/category/updateCategory")
const deleteCategory = require("../controller/category/deleteCategory")

// Banner Controllers
const createBanner = require("../controller/banner/createBanner")
const getAllBanners = require("../controller/banner/getAllBanners")
const getActiveBanners = require("../controller/banner/getActiveBanners")
const updateBanner = require("../controller/banner/updateBanner")
const deleteBanner = require("../controller/banner/deleteBanner")

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
const getRelatedProducts = require("../controller/product/getRelatedProducts");

// Payment Controllers
const createOrder = require("../controller/payment/createOrder");
const verifyPayment = require("../controller/payment/verifyPayment");
const createCODOrder = require("../controller/payment/createCODOrder");



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
router.get("/cart-products", authToken, getCartProducts)
router.post("/update-cart", authToken, updateCartProduct)
router.post("/delete-cart", authToken, deleteCartProduct)

// Site Settings Routes
router.get("/site-settings", getSiteSettings)
router.post("/update-site-settings", authToken, updateSiteSettings)

// Category Routes
router.post("/create-category", authToken, createCategory)
router.get("/categories", getAllCategories)
router.post("/update-category", authToken, updateCategory)
router.post("/delete-category", authToken, deleteCategory)

// Banner Routes
router.post("/create-banner", authToken, createBanner)
router.get("/banners", authToken, getAllBanners)
router.get("/active-banners", getActiveBanners)
router.post("/update-banner", authToken, updateBanner)
router.post("/delete-banner", authToken, deleteBanner)

router.get("/search",searchProduct)
router.get("/product-details/:id", getProductById);
router.get("/related-products", getRelatedProducts);

// Payment Routes
router.post("/create-order", authToken, createOrder);
router.post("/verify-payment", authToken, verifyPayment);
router.post("/create-cod-order", authToken, createCODOrder);

module.exports = router;
