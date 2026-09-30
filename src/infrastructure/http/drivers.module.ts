import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { DriverController } from "./controllers/driver.controller";
import { GetDriverByIdUseCase } from "../../application/drivers/get-driver-by-id/get-driver-by-id.use-case";
import { GetDriversUseCase } from "../../application/drivers/get-drivers/get-drivers.use-case";
import { DriverRepository } from "../../domain/ports/driver.repository";
import { DriverPrismaRepository } from "../database/repositories/driver.prisma.repository";

@Module({
    imports: [DatabaseModule],
    controllers: [DriverController],
    providers: [
        GetDriversUseCase,
        GetDriverByIdUseCase,
        { provide: DriverRepository, useClass: DriverPrismaRepository },
    ],
    exports: [DriverRepository],
})
export class DriversModule{}