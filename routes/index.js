const express = require("express");
const router = express.Router();

//  User Controllers
const authToken = require("../middleware/authToken");
const userDetailsController = require("../controller/user/userDetails");
const allUserController = require("../controller/user/allUser");
const updateAllUserController = require("../controller/user/updateALluser");
const useLogout = require("../controller/user/useLogOut"); //  Add this if you have logout controller

const addTocartController = require("../controller/user/addTocartController")
const getCartProducts = require("../controller/user/getCartProducts")
const updateCartProduct = require("../controller/user/updateCartProduct")
const deleteCartProduct = require("../controller/user/deleteCartProduct")
const updateProfile = require("../controller/user/updateProfile")
const addToWishlist = require("../controller/user/addToWishlist")
const removeFromWishlist = require("../controller/user/removeFromWishlist")
const getWishlist = require("../controller/user/getWishlist")
const {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controller/user/addressController")

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

// Trending Search Controllers
const getTrendingSearches = require("../controller/trendingSearch/getTrendingSearches")
const getAllTrendingSearches = require("../controller/trendingSearch/getAllTrendingSearches")
const createTrendingSearch = require("../controller/trendingSearch/createTrendingSearch")
const updateTrendingSearch = require("../controller/trendingSearch/updateTrendingSearch")
const deleteTrendingSearch = require("../controller/trendingSearch/deleteTrendingSearch")

// City Controllers
const getAllCities = require("../controller/city/getAllCities")
const createCity = require("../controller/city/createCity")
const updateCity = require("../controller/city/updateCity")
const deleteCity = require("../controller/city/deleteCity")

// Blog Controllers
const createBlog = require("../controller/blog/createBlog")
const getAllBlogs = require("../controller/blog/getAllBlogs")
const getBlogBySlug = require("../controller/blog/getBlogBySlug")
const updateBlog = require("../controller/blog/updateBlog")
const deleteBlog = require("../controller/blog/deleteBlog")
const getRecentBlogs = require("../controller/blog/getRecentBlogs")

// Brand Video Controllers
const createBrandVideo = require("../controller/brandVideo/createBrandVideo")
const getAllBrandVideos = require("../controller/brandVideo/getAllBrandVideos")
const updateBrandVideo = require("../controller/brandVideo/updateBrandVideo")
const deleteBrandVideo = require("../controller/brandVideo/deleteBrandVideo")

// Dashboard Controller
const getDashboardStats = require("../controller/dashboard/getDashboardStats")

// Service Inquiry Controllers
const createInquiry = require("../controller/serviceInquiry/createInquiry")
const getAllInquiries = require("../controller/serviceInquiry/getAllInquiries")
const updateInquiryStatus = require("../controller/serviceInquiry/updateInquiryStatus")

//  Product Controllers
const productData = require("../controller/product/productDataController");
const updateProduct = require("../controller/product/updateProduct");
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
const toggleTrending = require("../controller/product/toggleTrending");
const { trackProductView, getSuggestedProducts } = require("../controller/product/getSuggestedProducts");

// Payment Controllers
const createOrder = require("../controller/payment/createOrder");
const verifyPayment = require("../controller/payment/verifyPayment");
const createCODOrder = require("../controller/payment/createCODOrder");
const getAllOrders = require("../controller/payment/getAllOrders");

// Order Management Controllers
const { updateOrderStatus, getAllOrders: getAllOrdersAdmin, getOrderDetails } = require("../controller/order/updateOrderStatus");



// --------------------------- USER ROUTES ---------------------------

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
router.post("/update-product", authToken, updateProduct);
router.get("/get-product", getAllProduct);
router.delete("/delete-product/:id", deleteProduct);
router.get("/getCatogeryData", getCategoryProduct);
router.post("/category-product", getCategoryWiseProduct);
router.post("/toggle-trending", authToken, toggleTrending);


// user Add to Cart 
router.post("/addtocart", authToken, addTocartController)
router.get("/countAddToProduct", authToken, countAddToCartProduct)
router.get("/cart-products", authToken, getCartProducts)
router.post("/update-cart", authToken, updateCartProduct)
router.post("/delete-cart", authToken, deleteCartProduct)

// Wishlist Routes
router.post("/add-to-wishlist", authToken, addToWishlist)
router.post("/remove-from-wishlist", authToken, removeFromWishlist)
router.get("/wishlist", authToken, getWishlist)

// User Profile & Address Routes
router.post("/update-profile", authToken, updateProfile)
router.get("/user-addresses", authToken, getUserAddresses)
router.post("/add-address", authToken, addAddress)
router.post("/update-address", authToken, updateAddress)
router.post("/delete-address", authToken, deleteAddress)
router.post("/set-default-address", authToken, setDefaultAddress)

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

router.get("/search", searchProduct)
router.get("/product-details/:id", getProductById);
router.get("/related-products", getRelatedProducts);
router.post("/track-view/:id", trackProductView);
router.get("/suggested-products", getSuggestedProducts);

// Payment Routes
router.post("/create-order", authToken, createOrder);
router.post("/verify-payment", authToken, verifyPayment);
router.post("/create-cod-order", authToken, createCODOrder);
router.get("/all-orders", authToken, getAllOrders);

// Order Management Routes (Admin)
router.post("/update-order-status", authToken, updateOrderStatus);
router.get("/admin-orders", authToken, getAllOrdersAdmin);
router.get("/order-details/:orderId", authToken, getOrderDetails);

// Trending Search Routes
router.get("/trending-searches", getTrendingSearches)
router.get("/all-trending-searches", authToken, getAllTrendingSearches)
router.post("/create-trending-search", authToken, createTrendingSearch)
router.post("/update-trending-search", authToken, updateTrendingSearch)
router.post("/delete-trending-search", authToken, deleteTrendingSearch)

// City Routes
router.get("/cities", getAllCities)
router.post("/create-city", authToken, createCity)
router.post("/update-city", authToken, updateCity)
router.post("/delete-city", authToken, deleteCity)

// Blog Routes
router.post("/create-blog", authToken, createBlog)
router.get("/blogs", getAllBlogs)
router.get("/blog/:slug", getBlogBySlug)
router.get("/recent-blogs", getRecentBlogs)
router.post("/update-blog", authToken, updateBlog)
router.post("/delete-blog", authToken, deleteBlog)

// Brand Video Routes
router.post("/create-brand-video", authToken, createBrandVideo)
router.get("/brand-videos", getAllBrandVideos)
router.post("/update-brand-video", authToken, updateBrandVideo)
router.post("/delete-brand-video", authToken, deleteBrandVideo)

// Dashboard Route
router.get("/dashboard-stats", authToken, getDashboardStats)

// Service Inquiry Routes
router.post("/create-inquiry", createInquiry)
router.get("/all-inquiries", authToken, getAllInquiries)
router.post("/update-inquiry-status", authToken, updateInquiryStatus)

// AI RAG System Routes — inline handler using enhancedRAGService (no missing files)
const productModel = require("../models/productModel");
const { generateEnhancedRAGResponse } = require("../services/enhancedRAGService");

router.post("/ai/chat-enhanced", async (req, res) => {
  try {
    const { query, sessionId, userId } = req.body;
    if (!query?.trim()) return res.status(400).json({ success: false, message: "Query is required" });
    const response = await generateEnhancedRAGResponse(query, productModel);
    return res.json(response);
  } catch (err) {
    return res.json({ success: true, message: "STM Fruit Shop में आपका स्वागत है! 🍎 WhatsApp: +91 9142517255", intent: "fallback", recommendedProducts: [] });
  }
});

// Keep legacy chat endpoint pointing to same service
router.post("/ai/chat", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) return res.status(400).json({ success: false, message: "Query is required" });
    const response = await generateEnhancedRAGResponse(query, productModel);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Voice Assistant Routes ────────────────────────────────────────────────────
const VoiceSession = require("../models/voiceSessionModel");
const { processVoiceQuery } = require("../services/voice/voiceAgentService");

// POST /api/voice/chat — text in, AI text out (JSON)
router.post("/voice/chat", async (req, res) => {
  try {
    const { text, sessionId, userId } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "text is required" });

    const sid = sessionId || `http_${Date.now()}`;
    const result = await processVoiceQuery({ text: text.trim(), sessionId: sid, userId });

    // Persist turn
    await VoiceSession.findOneAndUpdate(
      { sessionId: sid },
      {
        $setOnInsert: { sessionId: sid, userId: userId || null },
        $push: {
          turns: {
            $each: [
              { role: "user", text: text.trim() },
              { role: "assistant", text: result.text, toolCalled: result.toolCalled || "" },
            ],
          },
        },
      },
      { upsert: true }
    ).catch(() => {});

    return res.json({
      success: true,
      text: result.text,
      sessionId: sid,
      toolCalled: result.toolCalled || null,
      toolResult: result.toolResult || null,
    });
  } catch (err) {
    console.error("voice/chat error:", err.message);
    return res.json({
      success: true,
      text: "माफ करें, अभी AI से connect नहीं हो पाया। WhatsApp करें: +91 9142517255",
      sessionId: req.body.sessionId || "fallback",
    });
  }
});

// POST /api/voice/feedback
router.post("/voice/feedback", async (req, res) => {
  try {
    const { sessionId, rating, text: feedbackText } = req.body;
    if (sessionId) {
      await VoiceSession.findOneAndUpdate({ sessionId }, { feedbackRating: rating, feedbackText: feedbackText || "" });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/voice/session/:id
router.get("/voice/session/:id", authToken, async (req, res) => {
  try {
    const session = await VoiceSession.findOne({ sessionId: req.params.id }).lean();
    if (!session) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: session });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Voice Admin Routes ────────────────────────────────────────────────────────
router.get("/voice/admin/sessions", authToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const [sessions, total] = await Promise.all([
      VoiceSession.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      VoiceSession.countDocuments(filter),
    ]);
    return res.json({ success: true, data: sessions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/voice/admin/stats", authToken, async (req, res) => {
  try {
    const [totalSessions, activeSessions, escalatedSessions] = await Promise.all([
      VoiceSession.countDocuments(),
      VoiceSession.countDocuments({ status: "active" }),
      VoiceSession.countDocuments({ status: "escalated" }),
    ]);
    return res.json({ success: true, data: { totalSessions, activeSessions, escalatedSessions } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/voice/admin/sessions/:id", authToken, async (req, res) => {
  try {
    await VoiceSession.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
