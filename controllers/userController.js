const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     },
// });
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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
};
const filterObj = function (obj, ...allowedFields) {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });
    return newObj;
};
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};
exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);
    //1) create error if user posts password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword',
                400
            )
        );
    }
    //2) Filter out unwanted fields names that are not allow to be updated
    // điều này là cần thiết bởi có nhiều field mà chỉ người admin mới có quyền thay đổi ví dụ như là role
    const filterBody = filterObj(req.body, 'name', 'email');
    if (req.file) filterBody.photo = req.file.filename;
    //3 Update user document
    const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true,
    });
    // Cái đoạn này mình hơi ngơ tí vì tự dưng nó là req.user.id mà lúc truyền body vào thì có mỗi phần name. Có thể là do bearer token chăng.
    // Bởi vì khi tắt cái authentic đi thì nó lại không chạy được nữa mà chuyển sang báo no log in :))) => chắc là có token rồi (tại chưa vừng phần token lắm)
    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:
            'this route is not yet defined. Please use /signup route instead',
    });
};
exports.getUser = factory.getOne(User);
// Dont update password with this Vì "save middleware" k chạy với findByIdAndUpdate
exports.updateUser = factory.updateOne(User);
/*
exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is not yet defined',
    });
};
*/
// cái này là xoá trực tiếp khỏi database còn deleteMe trên thỉ chỉ xoá người dùng khi người đó login thôi. (tức là chuyển active sang false)
// còn cái này là xoá dưới quyền admin
exports.deleteUser = factory.deleteOne(User);
