import { Injectable } from "@nestjs/common";
import { Driver } from "../../../domain/entities/driver.entity";
import { DriverRepository } from "../../../domain/ports/driver.repository";

@Injectable()
export class GetDriversUseCase {
    constructor(private readonly driverRepository: DriverRepository) {}

    async execute(): Promise<Driver[]> {
        return this.driverRepository.findAll();
    }
}