# ShipNow API

API REST desarrollada con Node.js, Express y MongoDB para la gestión de usuarios, productos, pedidos y entregas. El proyecto incorpora una arquitectura por capas, mocking, manejo centralizado de errores, logging con Winston, documentación Swagger/OpenAPI, testing funcional y carga de documentos y comprobantes mediante Multer.

Proyecto correspondiente a las pre-entregas de los módulos 1, 2, 3, 4, 5, 6 y 7 del curso **Programación Backend (III): Testing y Escalabilidad**, de Coderhouse.

## Tecnologías

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- dotenv
- Winston
- Multer
- swagger-ui-express
- Mocha
- Chai
- Supertest

## Instalación y configuración

1. Clonar el repositorio e ingresar a su directorio:

```bash
git clone https://github.com/Agustin-Zacarias/Backend-III-Preentrega-N7---Agustin-Zacarias
cd shipnow-api
```

2. Instalar las dependencias:

```bash
npm install
```

3. Crear el archivo `.env` en la raíz a partir de `.env.example`:

```env
PORT=3000
MONGODB_URI=TU_URI_DE_MONGODB_ATLAS
NODE_ENV=development
# Opcional: LOG_LEVEL=debug
```

Reemplazar `TU_URI_DE_MONGODB_ATLAS` por la URI propia de MongoDB Atlas. No publicar el archivo `.env` ni compartir sus credenciales.

4. Iniciar el servidor:

```bash
npm run dev
```

La aplicación se conecta a MongoDB antes de comenzar a escuchar solicitudes. Por defecto utiliza el puerto `3000`.

## Arquitectura

El proyecto mantiene la separación por capas:

```text
Request
   ↓
Routes
   ↓
Controllers
   ↓
Services
   ↓
Repositories
   ↓
Models
   ↓
MongoDB
```

Los errores se derivan al middleware global, que genera una respuesta HTTP uniforme.

- **Routes:** declaran los endpoints y delegan su ejecución a los controllers.
- **Controllers:** reciben los parámetros HTTP, llaman a los services y construyen las respuestas exitosas.
- **Services:** contienen la lógica de negocio y detectan los errores del dominio.
- **Repositories:** encapsulan las operaciones de persistencia mediante Mongoose.
- **Models:** definen los esquemas y las referencias entre documentos.
- **Middlewares:** gestionan los handlers asíncronos y centralizan las respuestas de error.

## Estructura relevante

```text
src/
├── config/
│   ├── db.js
│   ├── index.js
│   ├── swagger.js
│   └── multer.js
├── constants/
│   └── index.js
├── controllers/
│   ├── logger.controller.js
│   ├── mock.controller.js
│   ├── order.controller.js
│   ├── upload.controller.js
│   ├── product.controller.js
│   └── user.controller.js
├── docs/
│   └── openapi.js
├── errors/
│   ├── app-error.js
│   └── error.dictionary.js
├── logger/
│   └── logger.js
├── middlewares/
│   ├── async-handler.js
│   ├── error-handler.js
│   └── request-logger.js
├── models/
│   ├── delivery.model.js
│   ├── file-metadata.schema.js
│   ├── order.model.js
│   ├── product.model.js
│   └── user.model.js
├── repositories/
│   ├── mock.repository.js
│   ├── upload.repository.js
│   ├── order.repository.js
│   ├── product.repository.js
│   └── user.repository.js
├── routes/
│   ├── logger.router.js
│   ├── mocks.router.js
│   ├── deliveries.router.js
│   ├── orders.router.js
│   ├── products.router.js
│   └── users.router.js
├── services/
│   ├── mock.service.js
│   ├── upload.service.js
│   ├── order.service.js
│   ├── product.service.js
│   └── user.service.js
├── utils/
│   └── mock-data.factory.js
├── app.js
└── server.js

tests/
├── setup.js
├── helpers.js
├── users.test.js
├── orders.test.js
├── mocks.test.js
├── uploads.test.js
├── logger-swagger.test.js
└── routes-errors.test.js
```

## Endpoints de mocking

Todos los endpoints GET devuelven datos ficticios generados en memoria y no los guardan en MongoDB. El parámetro `qty` indica la cantidad de registros a generar; si se omite, se utiliza `1`. Se aceptan enteros entre `1` y `100`.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/mocks/users?qty=2` | Genera usuarios ficticios con rol `USER`. |
| GET | `/api/mocks/drivers?qty=2` | Genera usuarios ficticios con rol `DRIVER`. |
| GET | `/api/mocks/orders?qty=2` | Genera pedidos con referencias a usuarios ficticios. |
| GET | `/api/mocks/deliveries?qty=2` | Genera entregas con referencias a pedidos y repartidores ficticios. |
| GET | `/api/mocks/all?qty=2` | Devuelve el conjunto completo con las relaciones visibles. |
| POST | `/api/mocks/seed?qty=10` | Inserta diez usuarios ficticios en MongoDB. |
| POST | `/api/mocks/seed?qty=2&entity=all` | Inserta usuarios, repartidores, pedidos y entregas relacionados. |

### Generar datos sin persistir

Ejemplo:

```http
GET http://localhost:3000/api/mocks/users?qty=2
```

La respuesta es un array de usuarios ficticios. Los valores concretos cambian en cada solicitud y la contraseña no se incluye en las respuestas públicas.

Para inspeccionar todas las entidades en un mismo conjunto:

```http
GET http://localhost:3000/api/mocks/all?qty=2
```

La respuesta contiene `users`, `drivers`, `orders` y `deliveries`. Cada pedido referencia un usuario del conjunto; cada entrega referencia un pedido y un repartidor del mismo conjunto.

### Cargar datos de prueba en MongoDB

Para insertar solamente usuarios:

```http
POST http://localhost:3000/api/mocks/seed?qty=10
```

Respuesta ilustrativa:

```json
{
  "insertados": 10,
  "coleccion": "usuarios"
}
```

Para insertar las cuatro entidades relacionadas:

```http
POST http://localhost:3000/api/mocks/seed?qty=2&entity=all
```

Con `qty=2` se insertan dos usuarios, dos repartidores, dos pedidos y dos entregas (ocho documentos en total).

Los repartidores no utilizan una colección física independiente: se almacenan en `users` como documentos con el rol `DRIVER`. Por eso, en MongoDB habrá cuatro documentos en `users` (dos `USER` y dos `DRIVER`), dos en `orders` y dos en `deliveries`.

El parámetro `entity` acepta `users` o `all`. Si se omite, se utiliza `users`. Las cantidades fuera del rango permitido y los valores de `entity` no reconocidos generan errores HTTP centralizados.

## Modelos, roles y relaciones

- **User:** utiliza `firstName`, `lastName`, `email`, `password` y `role`. Los roles permitidos se centralizan en `USER_ROLES`, incluido `DRIVER`.
- **Order:** referencia a un usuario mediante `user`, contiene los ítems, el total, la dirección de envío, el estado y la prioridad.
- **Delivery:** referencia a un pedido mediante `order` y a un usuario con rol `DRIVER` mediante `driver`.

Los valores permitidos están centralizados en `src/constants/index.js`: `USER_ROLES`, `PRODUCT_STATUS`, `ORDER_STATUS`, `ORDER_PRIORITY` y `DELIVERY_STATUS`.

## Endpoints principales

### Pedidos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/orders` | Obtener todos los pedidos. |
| GET | `/api/orders/:oid` | Obtener un pedido por ID. |
| POST | `/api/orders` | Crear un pedido asociado a un usuario existente. |
| PATCH | `/api/orders/:oid/status` | Actualizar el estado de un pedido. |

### Usuarios

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/users` | Obtener todos los usuarios. |
| GET | `/api/users/:uid` | Obtener un usuario por ID. |
| POST | `/api/users` | Crear un usuario. |
| PUT | `/api/users/:uid` | Actualizar un usuario. |
| DELETE | `/api/users/:uid` | Eliminar un usuario. |

### Productos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/products` | Obtener todos los productos. |
| GET | `/api/products/:pid` | Obtener un producto por ID. |
| POST | `/api/products` | Crear un producto. |
| PUT | `/api/products/:pid` | Actualizar un producto. |
| DELETE | `/api/products/:pid` | Eliminar un producto. |

## Carga de archivos, documentos y comprobantes (Módulo 7)

La API utiliza **Multer** con almacenamiento en disco para recibir archivos mediante `multipart/form-data`. La configuración está centralizada en `src/config/multer.js`; no se configura Multer dentro de los routers.

### Tipos y límites

- Formatos admitidos: PDF (`application/pdf`), JPG/JPEG (`image/jpeg`) y PNG (`image/png`).
- Tamaño máximo por archivo: **5 MB**.
- Se admite un único archivo por solicitud, enviado en el campo `file`.
- Se comprueban la extensión, el MIME y la firma binaria del archivo.
- Los nombres se generan con UUID; no se utiliza el nombre enviado por el cliente como nombre físico.

### Documentos de usuario

```http
POST /api/users/:uid/documents
Content-Type: multipart/form-data
```

Campos del formulario:

| Campo | Tipo | Obligatorio | Valores |
|---|---|---|---|
| `file` | Archivo | Sí | PDF, JPG, JPEG o PNG; hasta 5 MB. |
| `documentType` | Texto | Sí | `IDENTITY`, `ADDRESS_PROOF`, `DRIVER_LICENSE` o `OTHER`. |

El usuario debe existir. El archivo se almacena en `uploads/user-documents/` y sus metadatos se agregan al array `documents` del usuario.

### Comprobantes de entrega

```http
POST /api/deliveries/:deliveryId/receipt
Content-Type: multipart/form-data
```

Campos del formulario:

| Campo | Tipo | Obligatorio | Valores |
|---|---|---|---|
| `file` | Archivo | Sí | PDF, JPG, JPEG o PNG; hasta 5 MB. |

La entrega debe existir. El archivo se almacena en `uploads/delivery-receipts/` y sus metadatos se asocian al campo `receipt` de la entrega con tipo `DELIVERY_RECEIPT`.

Esta ruta permite asociar comprobantes, pero no implementa un CRUD completo de entregas.

### Metadatos almacenados

MongoDB no almacena el contenido binario del archivo. Solo conserva:

- `originalName`: nombre original recibido.
- `filename`: nombre generado por el servidor.
- `path`: ruta relativa del archivo almacenado.
- `mimetype`: tipo MIME validado.
- `size`: tamaño en bytes.
- `documentType`: tipo de documento o `DELIVERY_RECEIPT`.
- `uploadedAt`: fecha de carga.

Si falla la validación o la asociación con la entidad, se elimina el archivo temporal para evitar archivos huérfanos.

### Errores de carga

Los errores utilizan el mismo formato centralizado del proyecto:

- `FILE_REQUIRED` (400): no se adjuntó el archivo.
- `INVALID_FILE_TYPE` (400): extensión, MIME o firma no permitidos.
- `INVALID_FILE_FIELD` (400): el archivo no se envió como `file` o se enviaron varios.
- `INVALID_DOCUMENT_TYPE` (400): tipo de documento no admitido.
- `FILE_TOO_LARGE` (413): archivo superior a 5 MB.
- `USER_NOT_FOUND` / `DELIVERY_NOT_FOUND` (404): entidad inexistente.
- `FILE_UPLOAD_FAILED` (500): error al almacenar el archivo o persistir sus metadatos.

Los intentos rechazados y las cargas correctas se registran mediante Winston.

### Almacenamiento y Git

Los archivos se escriben en:

```text
uploads/
├── user-documents/
└── delivery-receipts/
```

La carpeta `/uploads/` está en `.gitignore`. Los archivos cargados no deben subirse al repositorio. Para las pruebas funcionales se usa una carpeta temporal `.uploads-test/`, también excluida de Git.

## Manejo centralizado de errores

La API utiliza una capa común para representar, clasificar y responder los errores. Los services detectan las situaciones del dominio y lanzan errores personalizados; los controllers derivan los errores al middleware y no construyen respuestas de error.

La estructura del módulo es:

- `src/errors/error.dictionary.js`: diccionario de códigos, mensajes y estados HTTP.
- `src/errors/app-error.js`: clase base `AppError` y errores personalizados del dominio.
- `src/middlewares/async-handler.js`: deriva al middleware global los errores de handlers asíncronos de Express.
- `src/middlewares/error-handler.js`: normaliza errores de la aplicación, Express y Mongoose y construye la única respuesta HTTP de error.
- `src/app.js`: registra el manejador de rutas inexistentes y el middleware global al final de la cadena.

### Formato de respuesta

Todas las respuestas de error utilizan esta estructura:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_MOCK_QUANTITY",
    "message": "El parámetro qty debe ser un entero entre 1 y 100."
  }
}
```

`code` identifica el error de manera estable y `message` explica el problema. En errores de validación de Mongoose puede aparecer también `details` con los campos involucrados. Los errores internos no exponen mensajes técnicos ni detalles de la base de datos.

### Errores contemplados

- `VALIDATION_ERROR` (400): datos de entrada que no cumplen las validaciones.
- `INVALID_JSON` (400): cuerpo de la solicitud con JSON malformado.
- `INVALID_ID` (400): identificador con formato incorrecto.
- `INVALID_STATE` (400): estado fuera de los valores permitidos.
- `INVALID_MOCK_QUANTITY` (400): `qty` no entero, menor que 1 o mayor que 100.
- `INVALID_MOCK_ENTITY` (400): valor de `entity` distinto de `users` o `all`.
- `USER_NOT_FOUND`, `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND` y `DELIVERY_NOT_FOUND` (404): entidad inexistente.
- `ROUTE_NOT_FOUND` (404): endpoint inexistente.
- `DUPLICATE_EMAIL` y `DUPLICATE_RESOURCE` (409): conflicto por recurso duplicado.
- `MOCK_SEED_FAILED` (500): fallo durante la carga de datos ficticios.
- `FILE_REQUIRED`, `INVALID_FILE_TYPE`, `INVALID_FILE_FIELD` e `INVALID_DOCUMENT_TYPE` (400): validaciones de carga multipart.
- `FILE_TOO_LARGE` (413): archivo superior al límite de 5 MB.
- `FILE_UPLOAD_FAILED` (500): fallo al almacenar el archivo o sus metadatos.
- `DATABASE_ERROR` e `INTERNAL_SERVER_ERROR` (500): fallas internas o de persistencia.

Los errores de Mongoose se traducen centralmente: validaciones a `VALIDATION_ERROR`, errores de casteo a `INVALID_ID` y claves duplicadas a errores de conflicto. El middleware también controla el JSON malformado (`INVALID_JSON`).

### Cómo probar los errores

Con el servidor iniciado (`npm run dev`), se pueden enviar estas solicitudes desde Postman:

| Método | Solicitud | Resultado esperado |
|---|---|---|
| GET | `/api/mocks/users?qty=0` | 400 — `INVALID_MOCK_QUANTITY` |
| GET | `/api/mocks/users?qty=-2` | 400 — `INVALID_MOCK_QUANTITY` |
| GET | `/api/mocks/users?qty=abc` | 400 — `INVALID_MOCK_QUANTITY` |
| GET | `/api/mocks/users?qty=101` | 400 — `INVALID_MOCK_QUANTITY` |
| POST | `/api/mocks/seed?qty=1&entity=orders` | 400 — `INVALID_MOCK_ENTITY` |
| GET | `/api/users/no-es-un-id` | 400 — `INVALID_ID` |
| GET | `/api/api-que-no-existe` | 404 — `ROUTE_NOT_FOUND` |

Para probar `INVALID_JSON`, enviar `POST /api/users` con `Content-Type: application/json` y un body malformado, por ejemplo:

```text
{json-invalido
```

Para probar `VALIDATION_ERROR`, enviar `POST /api/products` con un producto incompleto, por ejemplo:

```json
{
  "name": "",
  "price": -1,
  "stock": -2
}
```

Para probar un recurso inexistente con un ID sintácticamente válido, consultar un ObjectId de 24 caracteres hexadecimales que no exista en la base de datos; el resultado esperado es 404 (`USER_NOT_FOUND` o `PRODUCT_NOT_FOUND`).

Los fallos durante `POST /api/mocks/seed` se traducen a `MOCK_SEED_FAILED`. La carga completa intenta revertir las inserciones parciales, eliminando primero entregas, luego pedidos y finalmente usuarios, para reducir el riesgo de dejar referencias huérfanas. No se debe provocar un fallo de base de datos en una base de producción para probar este caso.

## Logging y monitoreo básico

La aplicación utiliza **Winston** como logger centralizado. Los mensajes incluyen timestamp, nivel y descripción; cuando corresponde, también incluyen contexto técnico sin registrar contraseñas ni cuerpos completos de solicitudes.

### Niveles de log

Se definen seis niveles personalizados, ordenados de mayor a menor severidad:

| Nivel | Uso |
|---|---|
| `fatal` | Fallas críticas que impiden iniciar o mantener el servicio. |
| `error` | Errores inesperados, fallas de persistencia o de operaciones. |
| `warning` | Solicitudes rechazadas y errores esperados del dominio. |
| `info` | Inicio del servidor, conexión a MongoDB y operaciones importantes. |
| `http` | Solicitudes HTTP completadas, con método, ruta, estado y duración. |
| `debug` | Información detallada útil durante el desarrollo. |

### Diferencias por entorno

El comportamiento se determina mediante `NODE_ENV`:

- `development`: nivel mínimo `debug`, por lo que se muestran todos los niveles.
- `production`: nivel mínimo `info`; se filtran `http` y `debug` para reducir el volumen de registros.
- `test`: se silencian los transports del logger para que las pruebas no generen archivos de logs.

Se puede sobrescribir el nivel mínimo mediante la variable opcional `LOG_LEVEL` (`debug`, `http`, `info`, `warning`, `error` o `fatal`). Si no se define, se utiliza el nivel predeterminado del entorno.

### Persistencia y rotación

Los registros se muestran en consola y los niveles `error` y `fatal` se guardan en:

```text
logs/error.log
```

El archivo se rota por tamaño: al alcanzar **5 MB**, Winston genera archivos numerados de respaldo y mantiene un máximo de **14 archivos**. El archivo activo continúa siendo `logs/error.log`.

La carpeta `/logs/` está incluida en `.gitignore`, por lo que los registros generados no se suben a GitHub. La aplicación crea la carpeta automáticamente cuando inicia.

### Endpoint de prueba

Con el servidor iniciado en desarrollo, ejecutar desde Postman:

```http
GET http://localhost:3000/api/logger-test
```

El endpoint genera un registro de prueba en cada nivel (`debug`, `http`, `info`, `warning`, `error` y `fatal`) y devuelve una respuesta exitosa con la lista de niveles ejecutados.

En desarrollo, todos los niveles pueden verse en la consola. En `logs/error.log` solamente deben aparecer `error` y `fatal`. En producción se aplica el filtro definido por `LOG_LEVEL` o el nivel predeterminado `info`.

El endpoint es una herramienta interna de verificación y no representa una operación del negocio.

## Documentación de API con Swagger / OpenAPI

La API expone documentación interactiva mediante **Swagger UI**, basada en una especificación **OpenAPI 3.0.3**.

- Interfaz interactiva: `http://localhost:3000/api/docs`
- Especificación JSON: `http://localhost:3000/api/docs/openapi.json`

La configuración de Swagger está separada de las rutas de negocio:

- `src/docs/openapi.js`: información general de la API, tags, paths, parámetros, request bodies, respuestas y schemas reutilizables.
- `src/config/swagger.js`: configuración de Swagger UI y registro de las rutas de documentación.
- `src/app.js`: monta la documentación en `/api/docs` antes del manejador global de rutas inexistentes.

Para acceder, iniciar el servidor con `npm run dev` y abrir `http://localhost:3000/api/docs` en el navegador. Desde Swagger UI se pueden consultar los endpoints y utilizar **Try it out** para enviar solicitudes al servidor local.

### Módulos documentados

La documentación está organizada por los tags `Users`, `Orders`, `Deliveries`, `Mocks`, `Logger` y `Products`:

- **Users:** listado, consulta por ID, creación, actualización, eliminación, generación mock y carga de documentos mediante multipart/form-data.
- **Orders:** listado, creación, consulta por ID, actualización de estado y generación mock de pedidos.
- **Deliveries:** generación mock de entregas y carga de comprobantes mediante multipart/form-data.
- **Mocks:** generación conjunta en memoria y carga controlada en MongoDB.
- **Logger:** endpoint interno `GET /api/logger-test` para ejecutar los seis niveles de Winston. Es una herramienta de validación, no una funcionalidad del negocio.
- **Products:** listado, consulta por ID, creación, actualización y eliminación.

**Aclaración sobre Deliveries:** no existen rutas CRUD independientes para entregas. La entidad se genera mediante `GET /api/mocks/deliveries` y permite asociar comprobantes mediante `POST /api/deliveries/:deliveryId/receipt`; los pedidos cuentan con endpoints de consulta, creación y actualización de estado.

### Schemas reutilizables

La especificación define los schemas `User`, `Order`, `Delivery`, `OrderItem`, `ShippingAddress`, `Product`, `FileMetadata`, `UserDocumentUploadInput`, `DeliveryReceiptUploadInput`, `ErrorResponse`, `SuccessResponse`, `MockDataset` y las respuestas de carga del seed.

Los schemas de usuario público no exponen la contraseña; el campo `password` solo forma parte del body de alta o actualización de usuario.

### Errores documentados

Las operaciones documentan las respuestas de error reales de la API y reutilizan el formato centralizado:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_MOCK_QUANTITY",
    "message": "El parámetro qty debe ser un entero entre 1 y 100."
  }
}
```

La especificación contempla errores de validación (`VALIDATION_ERROR`), JSON inválido (`INVALID_JSON`), identificadores inválidos (`INVALID_ID`), estados inválidos (`INVALID_STATE`), archivos requeridos o inválidos (`FILE_REQUIRED`, `INVALID_FILE_TYPE`, `INVALID_FILE_FIELD`, `INVALID_DOCUMENT_TYPE`), tamaño excedido (`FILE_TOO_LARGE`), entidades inexistentes, duplicados, errores de carga (`FILE_UPLOAD_FAILED`), cantidades o entidades mock inválidas, errores de base de datos y errores internos.

`DELIVERY_NOT_FOUND` también se devuelve cuando se intenta asociar un comprobante a una entrega inexistente.

La API actual no implementa autenticación ni rutas protegidas; por eso la documentación no declara respuestas `401` o `403` ni esquemas de seguridad inexistentes.

### Probar los mocks desde Swagger

- Para generar información sin persistirla, usar los GET `/api/mocks/users`, `/api/mocks/drivers`, `/api/mocks/orders`, `/api/mocks/deliveries` o `/api/mocks/all`.
- Para insertar datos, usar `POST /api/mocks/seed` y completar los query parameters `qty` y `entity`. No requiere body JSON.
- `qty` debe ser un entero entre 1 y 100.
- `entity` admite `users` o `all`; si se omite, utiliza `users`.
- Para el conjunto completo, `entity=all` inserta usuarios, repartidores, pedidos y entregas relacionados.

## Testing funcional (Módulo 6)

La suite funcional utiliza **Mocha** para organizar y ejecutar pruebas, **Chai** para las aserciones y **Supertest** para realizar solicitudes HTTP directamente sobre la aplicación Express, sin abrir manualmente un puerto.

### Entorno de testing

Las pruebas utilizan una base MongoDB exclusiva. Crear `.env.test` a partir de `.env.test.example` y configurar `MONGODB_URI_TEST` con una base cuyo nombre incluya `test` (por ejemplo, `shipnow_test`).

El setup nunca utiliza `MONGODB_URI` de desarrollo y verifica que el nombre de la base de testing sea distinto del de desarrollo.

Variables necesarias en `.env.test`:

```env
NODE_ENV=test
MONGODB_URI_TEST=TU_URI_DE_MONGODB_DE_TESTING
UPLOADS_DIR=.uploads-test
```

`.env.test` está excluido de Git y no debe publicarse. Las pruebas requieren conexión a esa base de testing; no utilizan la base de desarrollo ni datos cargados manualmente.

### Ejecutar las pruebas

```bash
npm install
npm test
```

La suite está organizada en `tests/` y cubre Users, Orders, Mocks, Logger, Swagger, carga de documentos de usuario, comprobantes de entrega y errores HTTP. Se validan los códigos de estado, la estructura de las respuestas y las propiedades importantes del body.

Para probar la creación de pedidos, cada test crea primero un usuario válido dentro de la base de testing.

Los tests de archivos generan documentos PDF de prueba en memoria y verifican:

- carga correcta de un documento de usuario;
- solicitud sin archivo;
- tipo de archivo no permitido;
- archivo superior a 5 MB;
- campo de archivo incorrecto;
- tipo de documento inválido;
- usuario inexistente;
- carga de comprobante en una entrega existente;
- entrega inexistente.

La limpieza se ejecuta automáticamente antes de cada test y después de cada caso, eliminando documentos de Users, Products, Orders y Deliveries y los archivos de `.uploads-test/`. Esto permite ejecutar `npm test` varias veces sin depender del estado previo. La carpeta temporal de testing es distinta de `uploads/`, utilizada por el servidor de desarrollo.

El setup importa `src/app.js` directamente; el levantamiento del servidor y la conexión de desarrollo permanecen en `src/server.js`.

## Testing de carga de archivos (Módulo 7)

Los tests de `tests/uploads.test.js` utilizan `multipart/form-data` y archivos PDF de prueba generados en memoria. Cubren:

- carga correcta de un documento de usuario y persistencia de metadatos;
- ausencia del archivo requerido;
- tipo de archivo no permitido;
- archivo que supera los 5 MB;
- nombre de campo incorrecto;
- tipo de documento no permitido;
- usuario inexistente;
- carga correcta de un comprobante en una entrega;
- entrega inexistente.

La configuración de Multer se encuentra en `src/config/multer.js`. Durante los tests, `tests/setup.js` utiliza `.uploads-test/`, la limpia antes y después de cada caso y no toca la carpeta `uploads/` de desarrollo.

---

**Proyecto académico — Coderhouse**  
Programación Backend (III): Testing y Escalabilidad.