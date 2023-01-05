const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModel');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

//BUILD query
//1, Filtering
// const queryObj = { ...req.query };
// const excludedFields = ['page', 'sort', 'limit', 'fields'];
// excludedFields.forEach((el) => delete queryObj[el]);
// //Khi ta tìm kiếm thì query có thể gồm nhiều chức năng như page, sort.. vì filer này để lọc mấy cái đó ra khỏi query
// // Điều này có nghĩa là chúng ta cũng không cần phải làm như cái việc như trên mà dữ liệu vấn có thể in ra được

// //2, Advanced filtering
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(
//     /\b(gte|gt|lte|lt)\b/g,
//     (match) => `$${match}`
// );
// // console.log(JSON.parse(queryStr));
// let query = Tour.find(JSON.parse(queryStr));
//2, Sorting
// if (req.query.sort) {
//     const sortBy = req.query.sort.split(',').join(' ');
//     query = query.sort(sortBy);
// } else {
//     query = query.sort('-createdAt');
//     // sắp xếp dựa vào thời gian được tạo
// }

//3, field limiting (hay noi cach khac la tiem kiem của param thôi)
// if (req.query.fields) {
//     const fields = req.query.fields.split(',').join(' ');
//     query = query.select(fields);
// } else {
//     query = query.select('-__v');
//     // cái -__v này là bỏ không hiển thị __v
// }

//4, Pagination
//page=2&limit=10, 1-10: page1 , 11-20 : page2, 21-30: page3...
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 10;
// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit); // câu này tức là bỏ qua <skip> obj và thể hiện <limit> đối tượng từ đó
// if (req.query.page) {
//     const numTours = await Tour.countDocuments();
//     if (skip > numTours / limit)
//         throw new Error("This page doesn't exsit");
// }

//5, Excution query
// catchAsync(async (req, res) => {
//     const features = new APIfeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();
//     const tours = await features.query;

//     //SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours,
//         },
//     });
// });

//responding to URL

//catchAsync(async (req, res, next) => {
/*
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }
    Cách này không thể in ra được dòng  message kia. Cách dưới thì ok

    Mongoose no longer allows executing the same query object twice. If you do, you'll get a Query was already executed error. Executing the same query instance twice is typically indicative of mixing callbacks and promises, but if you need to execute the same query twice, you can call Query#clone() to clone the query and re-execute it.
    */
// console.log(process.env.NODE_ENV);

// handling GET resquest
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// handling POST requests
exports.createTour = factory.createOne(Tour);
// handling PATCH request
exports.updateTour = factory.updateOne(Tour);
// handling Delete request
exports.deleteTour = factory.deleteOne(Tour);
/*
exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }
    res.status(204).json({
        status: 'success',
        data: 'Delete successfully',
    });
});
*/
exports.getTourStats = catchAsync(async (req, res) => {
    // stats = static
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                // _id: '$price',
                _id: '$difficulty',
                // a group specification must include an _id
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: {
                avgPrice: -1,
            },
        },
        {
            $match: { _id: { $ne: 'easy' } },
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        // mỗi cái trong ngoặc ngoài được gọi là 1 stage
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },
        {
            $addFields: {
                month: '$_id',
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
        {
            $sort: {
                numTourStarts: -1,
            },
        },
        {
            $limit: 6,
        },
    ]);
    res.status(200).json({
        status: 'success',
        length: plan.length,
        data: {
            plan,
        },
    });
});
// Translate : Latitude Vĩ độ , Longitude : kinh độ
// 2 phương thức bên dưới dùng để tìm các tour trong một vùng cụ thể và tính toán khoảng cách
//'/tours-within/:distance/center/:lating/unit/:unit'
// /tours-within/233/center/-40.45,32.4493/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    /*Ta sẽ dành một chút để nói về phép tính để tính radius (dịch ra là bán kinh, nhưng nếu ở trên thì nó là radian (đơn vị góc đấy). Tuy nhiên Mongodb nó chỉ muốn cho mình truyền bán kính theo tham sôs có đơn vị là radian thôi.
    - Hai con số  3963.2 là bán kính trái đất ở miles(dặm) , còn 3678.1 là bán kính trái đât ở dạng đơn vị kilomet 
    - Thật ra công thức trên rất đơn giản chỉ là công thức tính cung tròn của hình tron thôi. L = R . x       (x đơn vị radian)
        x = Math.Pi * n / 180 ( n là góc quét của cung tròn)
*/
    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitute and longitude in the format lat,lng',
                400
            )
        );
    }
    // console.log(radius);
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });
    // Câu lệnh nay tìm kiếm theo một vòng tròn với tâm là centerSphere, và bán kính là radius
    // Có thể thấy tận mắt bằng cách vào Compass và thử ở phần schema của tours, kéo xuống cuói ó cái bản đồ, sau đó chọn create a circle là sẽ làm được -- cái này lên mongodb document đọc thêm nhé !
    console.log(distance, lat, lng, unit);
    res.status(200).json({
        stutus: 'success',
        result: tours.length,
        data: {
            data: tours,
        },
    });
});
exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitute and longtite in the format lat, lng.',
                400
            )
        );
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1],
                },
                distanceField: 'distance',
                // distanceMultiplier: 0.001,
                distanceMultiplier: multiplier,
            },
        },
        {
            //Trong cái $project này, nó sẽ cho phép cái nào được hiển thị ra cái nào không
            $project: {
                distance: 1,
                name: 1,
            },
        },
    ]);
    res.status(200).json({
        stutus: 'success',
        result: distances.length,
        data: {
            data: distances,
        },
    });
});

// upload multiple files
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    {
        name: 'images',
        maxCount: 3,
    },
]);
exports.resizeTourImages = async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    // 1)Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Images
    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${
                i + 1
            }.jpeg`;
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);
            req.body.images.push(filename);
        })
    );
    next();
};
// upload.single('image');
// upload.array('images', 5);
exports.getAllBookingOfTour = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });

    if (bookings.length() === 0) {
        return next(new AppError('You have not bought any tour', 401));
    }
    res.status(200).json({
        status: 'success',
        results: bookings.length,
        bookings: {
            data: bookings,
        },
    });
});
