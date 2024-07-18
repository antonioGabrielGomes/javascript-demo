import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserPresenter } from './user.presenter';
import { CreateCommonUserDto } from './dto/create-common-user.dto';

@Controller('users')
export class UsersController {

    constructor(
        private usersService: UsersService
    ) {}

    @Post()
    async create(@Body() data: CreateCommonUserDto) {
        const user = await this.usersService.createCommonUser(data);
        return new UserPresenter(user);
    }
}
