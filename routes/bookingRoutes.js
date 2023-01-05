const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
router.use(authController.protect, authController.isLoggedIn);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// Những cái route dưới này thì chỉ dùng được cho postman thôi nên cũng lười thực hành trong postman
router.use(authController.restrictTo('admin', 'lead-guide'));
router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking);
router
    .route('/id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = router;
