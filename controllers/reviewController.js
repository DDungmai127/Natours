const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//     // user for :Get-  tours/<TOUR ID>//reviews routes
//     let filter = {};
//     if (req.params.tourId) {
//         filter = { tour: req.params.toursId };
//     }
//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: {
//             reviews,
//         },
//     });
// });

// restricted that users can only review a tour that they have booked
exports.checkBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.find({
        user: req.user.id,
        tour: req.body.tour,
    });
    if (booking.length === 0) {
        return next(new AppError('You must buy this tour to review it', 401));
    }
    next();
});
exports.setTourUserIds = (req, res, next) => {
    if (!req.body.tour) {
        req.body.tour = req.params.tourId;
    }
    if (!req.body.user) {
        req.body.user = req.user.id;
        //req.use.id : ta lấy nó từ protect middleware (hoặc từ token)
    }
    next();
};
//Để đồng bộ với createOne thì ta tách cái phần xác định tour, user id thành một middleware
exports.createReview = factory.createOne(Review);
/*
exports.createReview = catchAsync(async (req, res, next) => {
    if (!req.body.tour) {
        req.body.tour = req.params.tourId;
    }
    if (!req.body.user) {
        req.body.user = req.user.id;
        //req.use.id : ta lấy nó từ protect middleware
    }
    const newReview = await Review.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            review: newReview,
        },
    });
});
*/

exports.getAllReviews = factory.getAll(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
