var express = require('express');
var router = express.Router();
let categoryModel = require('../schemas/category');
let productModel = require('../schemas/products');
let { CreateErrorRes, CreateSuccessRes } = require('../utils/responseHandler');

// Hàm tạo slug
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD') // Chuẩn hóa Unicode
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
    .replace(/[^a-z0-9]+/g, '-') // Thay ký tự đặc biệt bằng dấu -
    .replace(/(^-|-$)/g, ''); // Xóa dấu - ở đầu và cuối
};

/* Lấy danh sách danh mục */
router.get('/', async function(req, res, next) {
  try {
    let categories = await categoryModel.find({ isDeleted: false });
    CreateSuccessRes(res, categories, 200);
  } catch (error) {
    next(error);
  }
});

/* Lấy một danh mục theo ID hoặc Slug */
router.get('/:identifier', async function(req, res, next) {
  try {
    const identifier = req.params.identifier;
    let category;

    // Kiểm tra xem identifier có phải là ObjectId (ID) hay không
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    console.log('Identifier:', identifier); // Debug
    console.log('Is ObjectId:', isObjectId); // Debug

    if (isObjectId) {
      // Tìm theo _id
      category = await categoryModel.findOne({
        _id: identifier,
        isDeleted: false
      });
    } else {
      // Tìm theo slug
      category = await categoryModel.findOne({
        slug: identifier,
        isDeleted: false
      });
    }

    console.log('Category found:', category); // Debug

    if (!category) {
      return CreateErrorRes(res, 'Danh mục không tồn tại', 404);
    }
    
    CreateSuccessRes(res, category, 200);
  } catch (error) {
    next(error);
  }
});

/* Tạo danh mục mới */
router.post('/', async function(req, res, next) {
  try {
    let body = req.body;
    if (!body.name) {
      return CreateErrorRes(res, 'Tên danh mục là bắt buộc', 400);
    }
    
    let newCategory = new categoryModel({
      name: body.name,
      slug: generateSlug(body.name),
      description: body.description || ""
    });
    
    await newCategory.save();
    CreateSuccessRes(res, newCategory, 201);
  } catch (error) {
    if (error.code === 11000) {
      return CreateErrorRes(res, 'Tên danh mục hoặc slug đã tồn tại', 400);
    }
    next(error);
  }
});

/* Cập nhật danh mục */
router.put('/:id', async function(req, res, next) {
  let id = req.params.id;
  try {
    let body = req.body;
    let updatedInfo = {};
    
    if (body.name) {
      updatedInfo.name = body.name;
      updatedInfo.slug = generateSlug(body.name);
    }
    if (body.description !== undefined) {
      updatedInfo.description = body.description;
    }
    
    if (Object.keys(updatedInfo).length === 0) {
      return CreateErrorRes(res, 'Không có dữ liệu để cập nhật', 400);
    }
    
    let updatedCategory = await categoryModel.findByIdAndUpdate(
      id,
      updatedInfo,
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return CreateErrorRes(res, 'Danh mục không tồn tại', 404);
    }
    
    CreateSuccessRes(res, updatedCategory, 200);
  } catch (error) {
    if (error.code === 11000) {
      return CreateErrorRes(res, 'Tên danh mục hoặc slug đã tồn tại', 400);
    }
    next(error);
  }
});

/* Xóa danh mục (soft delete) */
router.delete('/:id', async function(req, res, next) {
  let id = req.params.id;
  try {
    let updatedCategory = await categoryModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!updatedCategory) {
      return CreateErrorRes(res, 'Danh mục không tồn tại', 404);
    }
    
    CreateSuccessRes(res, updatedCategory, 200);
  } catch (error) {
    next(error);
  }
});

/* Lấy sản phẩm theo slug danh mục và slug sản phẩm */
router.get('/:slugcategory/:slugproduct', async function(req, res, next) {
  try {
    const category = await categoryModel.findOne({
      slug: req.params.slugcategory,
      isDeleted: false
    });
    
    if (!category) {
      return CreateErrorRes(res, 'Danh mục không tồn tại', 404);
    }
    
    const product = await productModel.findOne({
      slug: req.params.slugproduct,
      category: category._id,
      isDeleted: false
    }).populate('category');
    
    if (!product) {
      return CreateErrorRes(res, 'Sản phẩm không tồn tại', 404);
    }
    
    CreateSuccessRes(res, product, 200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;