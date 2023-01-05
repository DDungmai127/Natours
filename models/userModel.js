const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell your name!'],
        minlength: [5, 'A tour nam must have more or equal than 5 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
        // Một cái email nó buồn cười lắm. Trong trường hợp như này ý, thì nó chỉ bắt lỗi những email mà có dạng "miyah@example" tức là nó k có thêm một cái đuôi nữa thôi
        /*
    email: { 
        type: String,
        required: true,
        match: /.+\@.+\..+/,
        unique: true
    }*/
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //this only works on SAVE or CREATE
            validator: function (el) {
                return el === this.password;
            },
            message: 'Password are not the same!',
        },
        select: false,
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Chỗ active này nó có ý nghĩa là khi người dùng được tạo thì mà active sẽ chạy
    // còn nếu người dùng muỗn xoá thì nó chỉ không cho người dùng active vào tài khoản thôi chứ không xoá tài khoản này đi. Ví dụ nếu họ đăng ký lại thì sẽ lại được sử dụng cái này
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});
/* Comment nó để import data nhé :D - Do data mà thầy Jonas cho nó đã ở dạng mã hoá rồi nếu để cái này thì nó mã hoá thêm lần nữa
- Khi làm đến bài cuối ở chương 12 thì ta bị gặp lỗi updatePassword, su đó log in vào k được, thì lí do bởi mình đã comment mất 2 cái middleware này trước đó, nên nó k thể bcrypt được pasword nên k có cái gì để encrypt cả tức là nên nó không khớp với mật khẩu.
- Chỉ comment 2 cái middleware save này khi mà ta import data theo mẫu thôi. Để tránh việc bị bcrypt 2 lần.*/
userSchema.pre('save', async function (next) {
    // only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    //hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }
    this.passwordChangeAt = Date.now() - 1000;
    next();
});

// trước khi tìm kiếm, nếu active không bằng true thì chuyển sang middleware khác, ngược lại thì lấy giá trị đó
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// instance method / static method
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangeAt) {
        // user never change password

        const changedTimestamp = parseInt(
            this.passwordChangeAt.getTime() / 1000,
            10
        );
        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
        // Nếu thời gian tạo pass < thời gian đổi pass: có đổi
        // Nếu thời gian tao pass > thời gian đổi pass : không đổi (trên thực tế nếu mà nó đã lọt vào cái này rồi thì chắc chắn là đã đổi pass rồi)
    }

    return false;
};

userSchema.methods.createResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    console.log({ resetToken }, this.passwordResetToken);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // work after 10mins

    return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
