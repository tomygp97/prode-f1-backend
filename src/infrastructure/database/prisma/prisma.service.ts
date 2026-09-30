import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { buildConnectionOptions } from './connection-options';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const options = buildConnectionOptions(process.env);
        super({ adapter: new PrismaMariaDb(options) });

        if (options.ssl && !options.ssl.ca) {
            new Logger(PrismaService.name).warn('DATABASE_SSL without DATABASE_SSL_CA: connection is encrypted but the server certificate is not verified');
        }
    }
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
