"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Why: Demo needs a runnable Nest app, not only static files.
 * How: Bootstrap Nest with AppModule and start HTTP server on demo port.
 * Example: `npm run start:dev` then GET /users/123.
 */
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    await app.listen(3001);
    console.log("Test repo demo API running on http://localhost:3001");
}
void bootstrap();
