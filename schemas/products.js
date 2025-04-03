let mongoose = require('mongoose');

let productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        unique: true,
        required: true // Giữ required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        default: 0,
        required: true,
        min: 0
    },
    description: {
        type: String,
        default: ""
    },
    urlImg: {
        type: String,
        default: ""
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Tự động tạo slug từ name khi tạo mới
productSchema.pre('save', function(next) {
    if (this.isModified('name') || !this.slug) { // Kiểm tra nếu name thay đổi hoặc slug chưa có
        this.slug = this.name
            .toLowerCase()
            .normalize('NFD') // Loại bỏ dấu tiếng Việt
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-') // Thay thế ký tự không hợp lệ bằng dấu '-'
            .replace(/(^-|-$)/g, ''); // Loại bỏ dấu '-' ở đầu và cuối
    }
    next();
});

// Cập nhật slug khi name thay đổi trong update
productSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.name) {
        update.slug = update.name
            .toLowerCase()
            .normalize('NFD') // Loại bỏ dấu tiếng Việt
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-') // Thay thế ký tự không hợp lệ bằng dấu '-'
            .replace(/(^-|-$)/g, ''); // Loại bỏ dấu '-' ở đầu và cuối
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);