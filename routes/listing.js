const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {listingSchema, reviewSchema} = require("../schema.js");
const Review = require("../models/review.js")
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js")
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

router.get("/search", listingController.search);

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.get("/filter/:category", wrapAsync(listingController.filterListings));
// Both Index and Create Routes
router.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn,upload.single("listing[image]"),validateListing, wrapAsync(listingController.createListing));
router.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn, isOwner, upload.single("listing[image]"),validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Index Route
// router.get("/",wrapAsync(listingController.index));
    
//Show Route
// router.get("/:id", wrapAsync(listingController.showListing));
  
  
//Create Route
// router.post("/",isLoggedIn,validateListing, wrapAsync(listingController.createListing));
  
//Edit Route
router.get("/:id/edit", isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm));
  
//Update Route
// router.put("/:id", isLoggedIn, isOwner, validateListing, wrapAsync(listingController.updateListing));
  
//Delete Route
// router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// router.get("/filter/:type", listingController.filter);
// 
// 
module.exports = router;