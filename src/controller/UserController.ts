import { inject } from "inversify";
import { controller } from "inversify-express-utils";
import { TYPES } from "../ioc-container/types";


@controller('/user')
export class UserController {
    constructor(

        // @inject(TYPES)
    ){}


}