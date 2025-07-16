import dotenv from 'dotenv'
import {cleanEnv, num, str} from 'envalid'

dotenv.config()

const env = cleanEnv(process.env, {
    PORT: num(),
    MONGO_URI: str(),
    REDIS_PORT: num(),
    REDIS_HOST: str(),
    AUTH_MESSAGE_TIMEOUT: num({ default: 60 * 1000 }),
    SECRET_KEY: str({default:'IAMSHREYANSH'}),
    GEMINI_API_KEY: str(),
    LLAMA_API_KEY: str(),
})



export default env;