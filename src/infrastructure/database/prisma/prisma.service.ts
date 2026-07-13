import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const url = new URL(process.env.DATABASE_URL as string);

        const adapter = new PrismaMariaDb({
          host: url.hostname,
          port: Number(url.port),
          user: url.username,
          password: url.password,
          database: url.pathname.replace('/', ''),
          allowPublicKeyRetrieval: true, 
        });

        super({ adapter });
    }
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}