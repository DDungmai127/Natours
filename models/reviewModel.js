const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            require: [true, 'Review can not be empty'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
// prevent duplicate reivews - tức là mõi người chỉ có thể bình luận, nhận xét về duy nhất một lần về một tour thôi ok !
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name',
    // }).populate({
    //     path: 'user',
    //     // chõ này để k bị lộ nhiều thông tin nên ta chỉ gửi ra từng này thôi
    //     select: 'name photo',
    // });
    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});
//static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // this point to this model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                // nhu group by
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
            // chỗ này sẽ in ra một mảng gồm 1 object bao gồm 3 thuộc tính trên
        },
    ]);
    console.log(stats);
    // Chỗ này ta làm vậy để lấy được giá trị trung bình của đánh giá và số lượt đánh giá sau đó update lại vào Tour mà mình đánh giá
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        });
    }
};

reviewSchema.post('save', function () {
    // this points to current review
    this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
//TỨc là chỗ này hoạt động với cả deleteReview , UpdateReview thì nó đều tác động làm thay đổi ratingsQuantity và ratingsAverage
reviewSchema.post(/^findOneAnd/, async (doc) => {
    await doc.constructor.calcAverageRatings(doc.tour);
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
