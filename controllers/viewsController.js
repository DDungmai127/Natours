const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverView = catchAsync(async (req, res) => {
    //1) Get tour data from collection
    const tours = await Tour.find();
    //2) Build template

    //3)REnder that template using tour data from 1
    res.status(200).render('overview', {
        title: 'All Tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });
    let tourDate;
    let isBooked;
    // console.log(req.user, tour.id);
    // console.log(res.locals.user);
    if (res.locals.user) {
        isBooked = await Booking.find({
            user: res.locals.user.id,
            tour: tour.id,
        });
        tourDate = isBooked.data;
    }
    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }
    // console.log(tour.id);
    // console.log(res.locals.user.id);
    console.log(isBooked);
    //2) Build template

    //3) Render template from

    res.status(200).render('tour', {
        title: `${tour.name} tour`,
        tour,
        isBooked,
        tourDate,
        // những cái được truyền vào ở chỗ này, xong sẽ được render và nhận làm dữ liệu bởi file pug
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log in your account',
    });
};

exports.getSignupForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'Sign up',
    });
};
exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });
    // 2) Find tours with the returns IDs
    const tourIDs = bookings.map((el) => el.tour.id);
    const tours = await Tour.find({ _id: { $in: tourIDs } });
    // cái in này như ở trong sql vậy

    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    });
});
exports.updateUserData = catchAsync(async (req, res, next) => {
    // console.log('Updating user', req.body);
    const updateUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).render('account', {
        title: 'Your account',
        user: updateUser,
    });
    // chỗ này sử dụng findById... vì nó chỉ có thông tin liên quan đến email và name thì ok. Còn nếu update gì đó liên quan đến password thì đừng sử dụng nhóm lệnh này, vì nó update mà không sử dụng save middleware tức là nókhoong encrypt password
});
