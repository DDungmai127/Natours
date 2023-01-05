const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const bookingRouter = require('./bookingRoutes');

const router = express.Router();
router.use('/:tourId/reviews', reviewRouter);

router.use('/:tourId/bookings', bookingRouter);
// router.param('id', tourController.checkID);

// Post: /tours/42992d1d/reviews
// Get: ../tours/424124d1d/reviews
// Get: ../tour/d11d1d/reviews/f11ee2d2d
// router
//     .route('/:tourId/reviews')
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReview
//     );

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);
router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    );

router.route('/tour-stats').get(tourController.getTourStats);
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.getMonthlyPlan
    );
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40.45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );

router
    .route(':/id/bookings')
    .get(
        authController.restrictTo('admin', 'lead-guide'),
        tourController.getAllBookingOfTour
    );
module.exports = router;
