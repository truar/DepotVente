import { Module, type DynamicModule } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller.js'
import { JwtAuthGuard } from './jwt-auth.guard.js'
import { PrismaUserRepository } from './prisma-user.repository.js'
import { USER_REPOSITORY } from './user-repository.interface.js'
import { UserService } from './user.service.js'

@Module({})
export class AuthModule {
  static register(options: { jwtSecret: string }): DynamicModule {
    return {
      module: AuthModule,
      // Global: JwtAuthGuard is used by the sync controllers too.
      imports: [JwtModule.register({ global: true, secret: options.jwtSecret })],
      controllers: [AuthController],
      providers: [
        UserService,
        JwtAuthGuard,
        { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
      ],
    }
  }
}
