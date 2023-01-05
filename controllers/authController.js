const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
    jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

const createSendToken = function (user, statusCode, res) {
    const token = signToken(user._id);
    // SENDING TOKEN VIA COOKIE
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        // secure:  true, // it means it only be send when using http request
        httpOnly: true, // means it cannot accessed or modified in nay way by brower
    };
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    res.cookie('jwt', token, cookieOptions);

    // remove password from output
    user.password = undefined;
    // sử dụng cookie thì nó gửi lại cả password nên ta phải set cho nó = undefined
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};
exports.signup = catchAsync(async (req, res, next) => {
    // .create(red.body) : là cái mà ta nói rằng chỉ hoạt động với create hoặc save đấy
    const newUser = await User.create(req.body); // Tức là khi mà muốn post lên thì phải dùng cửa sổ body trên postman để test
    const url = `${req.protocol}://${req.get('host')}/me`;
    // cái url này được truyền vào để khi ấn nút thì sẽ nhảy đến chỗ home_page. Xem file welcome chỗ href nó có url !
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    //1)check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }
    // 2) check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    const correct = await user.correctPassword(password, user.password);

    if (!user || !correct) {
        return next(new AppError('Indcorrect email or password!', 401));
    }
    // 3) if everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: 'success',
    });
};

// When using cookie-parser middleware, this property is an object that contains cookies sent by the request. If the request contains no cookies - chỗ này là đoạn doc nói về cái req.cookies
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer') // for Postman
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt; // For brower
    }
    if (!token) {
        return next(
            new AppError(
                'You are not logged in ! Please log to get access.',
                401
            )
        );
    }
    // 2) Verification token
    /* giải thích này: cái decoded này nó chứa các thong tin của người gửi yêu cầu gồm id, iat, exp với:
        + id ~ id
        + iat ~ init time 
        + exp ~ expired time
    - Những cái đó ta sẽ lấy được khi login */
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);
    // 3) check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist'
            ),
            401
        );
    }
    // 4) check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError('User recently changed password! Please log in again'),
            401
        );
    }

    //GRANT ACCESS TO PROTECTED ROUTES
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});
// the middleware   only for rendered website
exports.isLoggedIn = async (req, res, next) => {
    // console.log(req.cookies.jwt);
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            console.log(res.locals.user);
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

// handle user roles
exports.restrictTo =
    (...roles) =>
    (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permision to perform this action')
            );
        }
        next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address'), 401);
    }
    //2) generate the random reset token
    const resetToken = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    //3) send it to user's email
    try {
        const resetURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`;
        // resetUrl : Nếu bạn thắc mắc nó là đường dẫn sau khi ta nhận được resetToken từ email
        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(err);
        return next(
            new AppError(
                'There was an error sending the email. Try again later'
            ),
            500
        );
    }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
    //1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    //2) If token has not expired , and there is user, set new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    /* Trước khi làm việc với Tour thì ta chỉ dùng FindOneUpdate
    - còn với password thì ta dùng save(), để nó phải được kiểm tra qua
    validate, middleware.. */
    //3) Update changedPasswordAt property for the user
    //4) Log the user in, send JWT

    /*
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token,
    });
    <<is replace by <its>>
    */
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    //2) check if posted current password
    if (
        !(await user.correctPassword(req.body.currentPassword, user.password))
    ) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    //3) if so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // trước khi chạy save thì nó sẽ có một middleware.pre('save'... ) bên userModel sẽ làm nhiệm vụ thêm passwordChangeAt()

    //user.findByIdAndUpdate will not work as intended
    //4) log user in, send JWT
    createSendToken(user, 200, res);
});
