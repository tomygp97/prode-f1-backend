import { Controller, Get, Param } from "@nestjs/common";
import { GetDriverByIdUseCase } from "../../../application/drivers/get-driver-by-id/get-driver-by-id.use-case";
import { GetDriversUseCase } from "../../../application/drivers/get-drivers/get-drivers.use-case";

@Controller('drivers')
export class DriverController {
  constructor(
    private readonly getDriversUseCase: GetDriversUseCase,
    private readonly getDriverByIdUseCase: GetDriverByIdUseCase,
  ) {}

  @Get()
  async getDrivers() {
    return this.getDriversUseCase.execute();
  }

  @Get(':id')
  async getDriverById(@Param('id') id: string) {
    return this.getDriverByIdUseCase.execute(id);
  }
}