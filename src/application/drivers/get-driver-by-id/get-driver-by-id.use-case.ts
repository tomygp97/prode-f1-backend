import { Injectable } from "@nestjs/common";
import { Driver } from "../../../domain/entities/driver.entity";
import { DriverRepository } from "../../../domain/ports/driver.repository";

@Injectable()
export class GetDriverById {
    constructor(private readonly dirverRepository: DriverRepository) {}

    async execute(id: string): Promise<Driver | null> {
        return this.dirverRepository.findById(id);
    }
}