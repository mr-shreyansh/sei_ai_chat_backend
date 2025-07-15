import {injectable} from 'inversify'
import { controller, httpGet } from 'inversify-express-utils';


@controller('/hello')
export default class HelloController {

    constructor() {}

    @httpGet('/')
    public async getDisplayHello(): Promise<string> {
        return 'Good night';
    }
}