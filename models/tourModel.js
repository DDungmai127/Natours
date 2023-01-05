const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            // require la validate
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            // maxlength = maxLength :))
            maxlength: [
                40,
                'A tour nam must have Less or equaL than 40 characters',
            ],
            minlength: [
                10,
                'A tour nam must have more or equal than 40 characters',
            ],
            // validate: [validator.isAlpha,'Tour name must only contain  characters',], cai isAlpha nay kha la vo dung...
        },
        duration: {
            type: Number,
            require: [true, 'A tour must have a duration'],
        },
        slug: String,
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a diffculty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is 3 types: easy, medium, diffcult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.0,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must below 5.0'],
            // làm tròn 1 chữ số thập phân
            set: (val) => Math.round(val * 10) / 10,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            // required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this only points to current doc on NEW document creation
                    return val < this.price;
                },
                message: 'Discount price ({VALUE}) should below regular price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a description'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            require: [true, 'A tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, // làm thế này để không bị lộ dữ liệu (ngăn cấm việc select)
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            //GEOJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
// 1 = acsding, -1 = descending
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// Chỗ này ta có thể dùng getIndexes() để xem các index hoặc vào Compass ở phần indexes lên
// 2dsphere cũng là tên một loại indexs nhé :()
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});
// Tu cho nay la document middleware
// document middleware: runs before .save() and .create()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// embbding
/*
tourSchema.pre('save', async function (next) {
    const guidesPromises = this.guides.map(
        async (id) => await User.findById(id)
    );
    this.guides = await Promise.all(guidesPromises);
    next();
});
*/
/*
tourSchema.pre('save', function (next) {
    console.log('Will save document...');
    next();
});
tourSchema.post('save', function (doc, next) {
    console.log(doc);
    next();
});
*/
// QUERY Middleware
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangeAt',
    });
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took : ${Date.now() - this.start} milliseconds`);
    next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     console.log(this.pipeline());
//     next();
// });
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
