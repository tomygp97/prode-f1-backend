import { AppRole } from "../enums/app-role.enum";

export class User {
    private constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly password: string,
        public readonly name: string,
        public readonly appRole: AppRole,
    ) {}

    static create(props: { id: string, email: string, password: string, name: string, appRole?: AppRole }): User {
        return new User(props.id, props.email, props.password, props.name, props.appRole ?? AppRole.USER);
    }

    isAppAdmin(): boolean {
        return this.appRole === AppRole.ADMIN;
    }
}
