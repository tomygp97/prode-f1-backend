export class User {
    private constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly password: string,
        public readonly name: string,
    ) {}

    static create(props: { id: string, email: string, password: string, name: string}): User {
        return new User(props.id, props.email, props.password, props.name);
    }
}