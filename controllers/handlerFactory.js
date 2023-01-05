// 161. Building handler factory functions
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIfeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError('No tour found with that ID', 404));
        }
        res.status(204).json({
            status: 'success',
            data: 'Delete successfully',
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            // co chay validate hay khong
            runValidators: true,
        }); //return new documents
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                doc,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

// Giải thích chỗ "populate" này một chút. Trái với bên phần tourModel mình chỉ lấy mỗi thông số là ObjectId -> tức là chỉ hiện thị mỗi cái đó trong DB thôi
// Thì bên này ta sử dụng populate để lấy thêm thông tin của từ user id -> Ta đã biến nó thành một middleware làm việc với find... ở bên tourModel rồi nhé!
exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);
        const doc = await query;
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

exports.getAll = (Model) =>
    catchAsync(async (req, res) => {
        // to allow for nested GET reviews on tour
        let filter = {};
        if (req.params.tourId) {
            filter = { tour: req.params.toursId };
        }
        const features = new APIfeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        // const doc = await features.query.explain();
        const doc = await features.query;

        //SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc,
            },
        });
    });
