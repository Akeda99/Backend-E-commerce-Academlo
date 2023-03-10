const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const globalErrorHandler = require('../controllers/error.controller');
const AppError = require('../utils/appError');
const xss = require('xss-clean');
var hpp = require('hpp');

const { productRouter } = require('../routes/product.routes');
const { usersRouter } = require('../routes/user.routes');
const { db } = require('../database/db');
const { categoriesRouter } = require('../routes/categories.routes');
const { authRouter } = require('../routes/auth.routes');
const { rateLimit } = require('express-rate-limit');
const { default: helmet } = require('helmet');
const initModel = require('./init.model');
const { cartRouter } = require('../routes/cart.routes');
//1. CREAMOS UNA CLASE

class Server {
  constructor() {
    //DEFINIMOS LA APLICACIÓN DE EXPRESS Y SE LA ASIGNAMOS A LA PROPIEDAD APP
    this.app = express();
    //DEFINIMOS EL PUERTO QUE LO TENEMOS EN LOS ENVIROMENTS
    this.port = process.env.PORT || 3000;
    this.limiter = rateLimit({
      max: 100,
      windowMs: 60 * 60 * 1000,
      message: 'Too many request from this IP, please try again in an hour!',
    });
    //DEFINIMOS LOS PATHS DE NUESTRA APLICACIÓN
    this.paths = {
      user: '/api/v1/user',
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      auth: '/api/v1/auth',
      cart: '/api/v1/cart',
    };

    //LLAMO EL METODO DE CONEXION A LA BASE DE DATOS
    this.database();

    //INVOCAMOS EL METODO MIDDLEWARES
    this.middlewares();

    //INVOCAMOS EL METODO ROUTES
    this.routes();
  }

  //MIDDLEWARES
  middlewares() {
    this.app.use(helmet());

    this.app.use(xss());

    this.app.use(hpp());

    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }
    this.app.use('/api/v1', this.limiter);
    //UTILIZAMOS LAS CORS PARA PERMITIR ACCESSO A LA API
    this.app.use(cors());
    //UTILIZAMOS EXPRESS.JSON PARA PARSEAR EL BODY DE LA REQUEST
    this.app.use(express.json());
  }

  //RUTAS
  routes() {
    //utilizar las rutas de productos
    this.app.use(this.paths.products, productRouter);
    //Utiliar las rutas de cart
    this.app.use(this.paths.cart, cartRouter)
    //utilizar las rutas de usuarios
    this.app.use(this.paths.user, usersRouter);
    //utilizar las rutas de categorias
    this.app.use(this.paths.categories, categoriesRouter);
    //utilizar las rutas de autenticacion
    this.app.use(this.paths.auth, authRouter);

    this.app.all('*', (req, res, next) => {
      // esto lo que hace es mandar error cuando el cliente se equivoca con el URL el * siginifica "todo", en este caso
      // aunque el cliente tipee api/v1/ categorieszzzr213213123 le mandaria error, es un error operacional
      return next(
        new AppError(`Can't find ${req.originalUrl} on this server!`, 404)
      );
    });

    this.app.use(globalErrorHandler);
  }

  database() {
    db.authenticate()
      .then(() => console.log('Database authenticated'))
      .catch(error => console.log(error));

    // Relations
    initModel();

    db.sync()
      .then(() => console.log('Database synced'))
      .catch(error => console.log(error));
  }

  //METODO PARA ESCUCHAR SOLICITUDES POR EL PUERTO
  listen() {
    this.app.listen(this.port, () => {
      console.log('Server is running on port', this.port);
    });
  }
}

//2. EXPORTAMOS EL SERVIDOR
module.exports = Server;
