/**
 * Why: Demo needs a runnable Nest app, not only static files.
 * How: Bootstrap Nest with AppModule and start HTTP server on demo port.
 * Example: `npm run start:dev` then GET /users/123.
 */
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
  console.log("Test repo demo API running on http://localhost:3001");
}

void bootstrap();
