var express = require('express');
var router = express.Router();
let productModel = require('../schemas/products');
let categoryModel = require('../schemas/category');
let { CreateErrorRes, CreateSuccessRes } = require('../utils/responseHandler');

/* Lấy danh sách sản phẩm */
router.get('/', async function(req, res, next) {
  try {
    let products = await productModel.find({ isDeleted: false }).populate('category');
    CreateSuccessRes(res, products, 200);
  } catch (error) {
    next(error);
  }
});

/* Lấy một sản phẩm theo ID hoặc Slug */
router.get('/:identifier', async function(req, res, next) {
  try {
    const identifier = req.params.identifier;
    let product;

    // Kiểm tra xem identifier có phải là ObjectId (ID) hay không
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isObjectId) {
      // Tìm theo _id
      product = await productModel.findOne({
        _id: identifier,
        isDeleted: false
      }).populate('category');
    } else {
      // Tìm theo slug
      product = await productModel.findOne({
        slug: identifier,
        isDeleted: false
      }).populate('category');
    }

    if (!product) {
      return CreateErrorRes(res, 'Sản phẩm không tồn tại', 404);
    }

    CreateSuccessRes(res, product, 200);
  } catch (error) {
    next(error);
  }
});

/* Tạo sản phẩm mới */
router.post('/', async function(req, res, next) {
  try {
    let body = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!body.name || !body.price || !body.quantity || !body.category) {
      return CreateErrorRes(res, 'Tên, giá, số lượng và danh mục là bắt buộc', 400);
    }

    // Tìm category theo _id
    let category = await categoryModel.findById(body.category);
    if (!category || category.isDeleted) {
      return CreateErrorRes(res, 'Danh mục không tồn tại', 404);
    }

  
    const slug = body.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    let newProduct = new productModel({
      name: body.name,
      price: body.price,
      quantity: body.quantity,
      category: category._id,
      description: body.description || "",
      urlImg: body.urlImg || "",
      slug: slug // Thêm slug vào sản phẩm
    });

    await newProduct.save();
    await newProduct.populate('category');
    CreateSuccessRes(res, newProduct, 201);
  } catch (error) {
    if (error.code === 11000) {
      return CreateErrorRes(res, 'Tên sản phẩm hoặc slug đã tồn tại', 400);
    }
    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      return CreateErrorRes(res, error.message, 400);
    }
    next(error);
  }
});

/* Cập nhật sản phẩm */
router.put('/:id', async function(req, res, next) {
  let id = req.params.id;
  try {
    let body = req.body;
    let updatedInfo = {};

    // Kiểm tra và cập nhật các trường
    if (body.name) updatedInfo.name = body.name;
    if (body.price) updatedInfo.price = body.price;
    if (body.quantity !== undefined) updatedInfo.quantity = body.quantity;
    if (body.description !== undefined) updatedInfo.description = body.description;
    if (body.urlImg !== undefined) updatedInfo.urlImg = body.urlImg;

    if (body.category) {
      let category = await categoryModel.findById(body.category);
      if (!category || category.isDeleted) {
        return CreateErrorRes(res, 'Danh mục không tồn tại', 404);
      }
      updatedInfo.category = category._id;
    }

    if (Object.keys(updatedInfo).length === 0) {
      return CreateErrorRes(res, 'Không có dữ liệu để cập nhật', 400);
    }

    let updatedProduct = await productModel.findByIdAndUpdate(
      id,
      updatedInfo,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return CreateErrorRes(res, 'Sản phẩm không tồn tại', 404);
    }

    await updatedProduct.populate('category');
    CreateSuccessRes(res, updatedProduct, 200);
  } catch (error) {
    if (error.code === 11000) {
      return CreateErrorRes(res, 'Tên sản phẩm hoặc slug đã tồn tại', 400);
    }
    next(error);
  }
});

/* Xóa sản phẩm (soft delete) */
router.delete('/:id', async function(req, res, next) {
  let id = req.params.id;
  try {
    let updatedProduct = await productModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!updatedProduct) {
      return CreateErrorRes(res, 'Sản phẩm không tồn tại', 404);
    }

    await updatedProduct.populate('category');
    CreateSuccessRes(res, updatedProduct, 200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;