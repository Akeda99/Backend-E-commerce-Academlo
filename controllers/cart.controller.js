const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const ProductInCart = require("../models/productInCart.model");
const catchAsync = require("../utils/catchAsync");

exports.addProductToCart = catchAsync(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const { cart } = req;
  
    const productInCart = await ProductInCart.create({
      cartId: cart.id,
      productId,
      quantity,
    });
  
    res.status(201).json({
      status: 'success',
      message: 'The product has been added',
      productInCart,
    });
  });

  exports.updateCart = catchAsync(async (req, res, next) => {

    const { newQty } = req.body;
    const { productInCart } = req;
  
    if( newQty < 0 ){
      return next(new AppError('The quantity must be greater than 0', 400))
    }
  
    if(newQty === 0){
      await productInCart.update({ quantity: newQty, status: 'removed' })
    }else{
      await productInCart.update({ quantity: newQty, status: 'active' })
    }
  
    res.status(201).json({
      status: 'success',
      message: 'The product in cart has been added',
    });
  });

  exports.removeProductToCart = catchAsync(async (req, res, next) => {
    const { productInCart } = req;
  
    await productInCart.update({ quantity: 0, status: 'removed' });
  
    res.status(200).json({
      status: 'success',
      message: 'The product in cart has been removed',
    });
  });
  
  exports.buyProductOnCart = catchAsync(async (req, res, next) => {
    const { sessionUser } = req;

  //1. buscar el carrito del usuario

  const cart = await Cart.findOne({
    attributes: ['id', 'userId'],
    where: {
      userId: sessionUser.id,
      status: 'active',
    },
    include: [
      {
        model: ProductInCart,
        attributes: { exclude: [ 'createdAt', 'updatedAt'] },
        where: {
          status: 'active',
        },
        include: [
          {
            model: Product,
            attributes: { exclude: [ 'status', 'createdAt', 'updatedAt'] },
          },
        ],
      },
    ],
  });
  if(!cart){
    return next(new AppError ('There are no products in cart', 400));
  }
// 2. calcular el precio total a pagar
let totalPrice=0;

cart.productInCarts.forEach(productInCart => {

 totalPrice += productInCart.quantity*productInCart.product.price ;
});

// 3. vamos a actualizar el stock o cantidad del modelo Product

const purchaseProductPromises= cart.productInCarts.map(async productInCart => {
const product= await Product.findOne({
where: {
  id: productInCart.product.id,
},
});

const newStock= product.quantity- productInCart.quantity;

return await product.update({ quantity: newStock });
}
);
// esto espera que todas las promesas dentro de esa constante a que se resuelvan
await Promise.all(purchaseProductPromises);

//crearse una constante que se la van a asignar al map, statusProductInCartPromises

  //recorrer el arreglo de productsInCarts

  //buscar el producto en el carrito a actualizar

  //retornar las actualizaciones del producto en el carrito encontrado, y el status: 'purchased'

  //fuera del map van a resolver las promesas con el promise All

const statusProductInCartPromises= cart.productInCarts.map(
  async productInCart =>{
    const productInCartFoundIt= await ProductInCart.findOne({
      where:{
        id: productInCart.id,
        status: 'active',
      },
    });
    return await productInCartFoundIt.update({status: 'purchased'})
  }
);
 await Promise.all(statusProductInCartPromises);

 await cart.update({status: 'purchased'});

const order = await Order.create({
  userId: sessionUser.id,
  cartId: cart.id,
  totalPrice,
});

  res.status(201).json({
    message: 'The order has been generated succesfully'
  });
  })
