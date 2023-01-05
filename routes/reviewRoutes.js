const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
// const bookingController = require('../controllers/bookingController');

const router = express.Router({ mergeParams: true });
// Giải thích một chút về cái chỗ mergeParams này: Đây là một tính năng khá hay> nó cho phép ta có thể lấy param một cách linh hoạt không phải phụ thuộc vào tình URL chỉ định lúc đầu tức là ở dưới kia thì ta có duy nhất là '/.../ > nếu khôgn dùng options này thì ta k thể lấy được những route có dạng /tours/df3f2f2/reviews . Sau khi thêm nó vào thì ta có thể lấy được chúng và có thể thực hiện được côgn việc được viết ra bên trong tourRoutes và reviewController(hàm createReview)
router.use(authController.protect);
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.checkBooking,
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('admin', 'user'),
        reviewController.updateReview
    )
    .delete(authController.restrictTo('admin'), reviewController.deleteReview);
module.exports = router;
