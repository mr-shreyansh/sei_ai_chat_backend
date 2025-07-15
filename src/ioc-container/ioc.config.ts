import { Container } from "inversify";
import Hello from "../controller/Hello";
import { TYPES } from "./types";
import { UserOp } from "../database/mongo/UserOp";
import RedisService from "../utils/redis/RedisService";
import { TYPE } from "inversify-express-utils";
import { AuthController } from "../controller/AuthController";
import { AuthService } from "../services/AuthService";
import AuthMiddleware from "../middleware/AuthMiddleware";
import { LlmController } from "../controller/LlmController";
import { LlmService } from "../services/LlmService";
import { ILlmService } from "../services/interfaces/ILlmService";
import { MCPService } from "../services/MCPService";

const container = new Container()

container.bind<AuthController>(TYPES.AuthController).to(AuthController)
container.bind<LlmController>(TYPES.LlmController).to(LlmController)

container.bind<AuthService>(TYPES.AuthService).to(AuthService)
container.bind<ILlmService>(TYPES.LlmService).to(LlmService)
container.bind<RedisService>(TYPES.RedisService).to(RedisService)
container.bind<MCPService>(TYPES.MCPService).to(MCPService)

container.bind<Hello>(TYPES.Hello).to(Hello);
container.bind<UserOp>(TYPES.UserOp).to(UserOp)

container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware)

export default container