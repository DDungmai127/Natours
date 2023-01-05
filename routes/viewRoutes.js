const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();
const viewsController = require('../controllers/viewsController');
const bookingController = require('../controllers/bookingController');

router.get(
    '/',
    bookingController.createBookingCheckout,
    authController.isLoggedIn,
    viewsController.getOverView
);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.get('/signup', viewsController.getSignupForm);
router.post(
    '/submit-user-data',
    authController.protect,
    viewsController.updateUserData
);
module.exports = router;
