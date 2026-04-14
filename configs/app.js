`use strict`;

// Importaciones
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { corsOptions } from "./cors-configuration.js";
import helmet from "helmet";
import { helmetConfiguration } from "./helmet-configuration.js";
import { requestLimit } from "../middlewares/request-limit.js";

// Importaciones
import usersRoutes from "../src/users/users-routes.js";
import restaurantsRoutes from "../src/restaurants/restaurants-routes.js";
import reservationsRoutes from "../src/reservations/reservations-routes.js";
import gastronomicEventsRoutes from "../src/gastronomicEvents/gastronomicEvents-routes.js";
import productsRoutes from "../src/products/products-routes.js";
import ordersRoutes from "../src/orders/orders-routes.js";
import categoriesRoutes from "../src/categories/categories-routes.js";
import itemsRoutes from "../src/items/items-routes.js";
import swaggerUI from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const BASE_URL = '/bite-and-go/v1';

// Conexión a DB
import { dbConnection } from './db.js';

const middlewares = (app) => {
    app.use(helmet(helmetConfiguration));
    app.use(cors(corsOptions));
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(requestLimit);
    app.use(morgan("dev"));
}

// Integración de rutas para el Cliente
const routes = (app) => {
    app.use(`${BASE_URL}/users`, usersRoutes);
    app.use(`${BASE_URL}/restaurants`, restaurantsRoutes);
    app.use(`${BASE_URL}/reservations`, reservationsRoutes);
    app.use(`${BASE_URL}/gastronomicEvents`, gastronomicEventsRoutes);
    app.use(`${BASE_URL}/products`, productsRoutes);
    app.use(`${BASE_URL}/orders`, ordersRoutes);
    app.use(`${BASE_URL}/categories`, categoriesRoutes);
    app.use(`${BASE_URL}/items`, itemsRoutes);
}

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: "Bite&Go API-User",
            version: '1.0.0',
        },
        servers: [
            {
                url: "http://localhost:3001/bite-and-go/v1",
            }
        ],
    },
    apis: [
        './src/**/*.js',
        './app.js'
    ],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

// Función para iniciar el servidor
const initServer = async (app) => {
    app = express();
    // Puerto 3001 para Usuarios
    const PORT = process.env.PORT || 3001;

    try {
        dbConnection();
        middlewares(app);
        routes(app);

        app.use('/bite-and-go/v1/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

        app.listen(PORT, () => {
            console.log(`[Bite&Go User Service] iniciado en el puerto ${PORT}`);
            console.log(`URL BASE: http://localhost:${PORT}${BASE_URL}`);
        });

        // Ruta de prueba
        app.get(`${BASE_URL}/prueba`, (req, res) => {
            res.status(200).json({
                status: 'ok',
                service: 'Bite&Go User Service',
                version: '1.0.0'
            });
        });

    } catch (error) {
        console.log(error);
    }
}

export { initServer };