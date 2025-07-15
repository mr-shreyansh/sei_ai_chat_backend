
export const TYPES = {
    // controllers
    AuthController: Symbol.for('AuthController'),
    LlmController: Symbol.for('LlmController'),
    Hello: Symbol.for('Hello'),

    // services
    AuthService: Symbol.for('AuthService'),
    LlmService: Symbol.for('LlmService'),
    RedisService: Symbol.for('RedisService'),
    MCPService: Symbol.for('MCPService'),

    // database
    UserOp: Symbol.for('UserOp'),

    // middleware
    AuthMiddleware: Symbol.for('AuthMiddleware')
};
