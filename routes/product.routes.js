const { Router } = require('express');
const { check } = require('express-validator');
const {
  findProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  findProduct,
} = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { validProductById } = require('../middlewares/products.middlewares');
const { validateFields } = require('../middlewares/validateField.middleware');
const { createProductValidation } = require('../middlewares/validations.middleware');
const { upload } = require('../utils/multer');

const router = Router();

router.get('/', findProducts);

router.get('/:id', validProductById, findProduct);

router.use(protect); // todas las rutas que esten por debajo del router.use protect van a estar protegidas


router.post(
  '/',
  
    upload.array("productImgs",3),
    createProductValidation,
    validateFields,
    restrictTo('admin'),
    createProduct
);

router.patch(
  '/:id',
  [
    check('title', 'The title is required').not().isEmpty(),
    check('description', 'The description is required').not().isEmpty(),
    check('quantity', 'The quantity is required').not().isEmpty(),
    check('quantity', 'The quantity must be a number').isNumeric(),
    check('price', 'The price is required').not().isEmpty(),
    check('price', 'The price must be a number').isNumeric(),
    validateFields,
    validProductById,
    restrictTo('admin'),
  ],
  updateProduct
);

router.delete('/:id', validProductById, restrictTo('admin'), deleteProduct);

module.exports = {
  productRouter: router,
};
