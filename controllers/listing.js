const Listing = require("../models/listing");
const mongoose = require("mongoose");
const mapToken = process.env.MAP_TOKEN;
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const geocodingClient = mbxGeocoding({accessToken: mapToken});
const Review = require("../models/review");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    mongoose.set("strictPopulate", false);
    const listing = await Listing.findById(id)
    .populate({
      path : "reviews",
      populate : {
        path : "author",
      } 
    })
    .populate("owner");
    if(!listing){
      req.flash("error", "Listing you requested for does not exist!");
      res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing, mapToken: process.env.MAP_TOKEN });
};

module.exports.createListing = async (req, res) => {

  let response = await geocodingClient
  .forwardGeocode({
    query: req.body.listing.location,
    limit:1,
  })
  .send();

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};

    if (response.body.features.length > 0) {
      newListing.geometry = response.body.features[0].geometry;
  } else {
      newListing.geometry = { type: "Point", coordinates: [0, 0] }; // Default value
      console.error("Geocoding API failed for:", req.body.listing.location);
  }
    let savedListing = await newListing.save();
    req.flash("success", "New Listing Created!!!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
      req.flash("error", "Listing you requested for does not exist!");
      res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    // let listing = await Listing.findById(id);
  
    // Update all listing fields
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
  if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url, filename};
    // Handle the image field properly
    // if (req.body.listing.image) {
    //   listing.image.url = req.body.listing.image.url || listing.image.url; // Keep old URL if empty
    //   listing.image.filename = req.body.listing.image.filename || listing.image.filename;
    // }
  
    await listing.save();
  } 
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;

    // Find the listing first
    let deletedListing = await Listing.findById(id);
    if (!deletedListing) {
        return res.redirect("/listings"); // Redirect if listing is not found
    }

    // Delete all reviews linked to this listing
    await Review.deleteMany({ _id: { $in: deletedListing.reviews } });

    // Now delete the listing
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

// module.exports.search = async (req, res) => {
//   let search = req.query.search;
//   search = search.toLowerCase();
//   let allListings = await Listing.find({ type: search });
//   if (allListings.length === 0) {
//     req.flash("error", "No such results found!");
//     return res.redirect("/listings");
//   }
//   res.render("listings/index.ejs", { allListings });
// };

// module.exports.filter = async (req, res) => {
//   let { type } = req.params;
//   console.log(type);
//   type = type.toLowerCase();
//   let allListings = await Listing.find({ type: type });
//   if (allListings.length === 0) {
//     req.flash("error", "No such results found!");
//     return res.redirect("/listings");
//   }
//   res.render("listings/index.ejs", { allListings });
// };

// 
module.exports.search = async (req, res) => {
  let search = req.query.search;
  if (!search) {
      req.flash("error", "Please enter a search query!");
      return res.redirect("/listings");
  }

  search = search.toLowerCase(); // Convert search input to lowercase

  let allListings = await Listing.find({ type: search });

  if (allListings.length === 0) {
      req.flash("error", "No results found!");
      return res.redirect("/listings");
  }

  res.render("listings/index.ejs", { allListings });
};
// 

