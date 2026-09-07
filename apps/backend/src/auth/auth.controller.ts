import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { SigninDto } from './signin.dto.js'
import { UserService } from './user.service.js'
import {
  CurrentUser,
  JwtAuthGuard,
  type AuthenticatedUser,
} from './jwt-auth.guard.js'

@Controller()
export class AuthController {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
  ) {}

  @Post('signin')
  @HttpCode(200)
  async signin(@Body() { email, password }: SigninDto) {
    const user = await this.users.verifyCredentials(email, password)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const token = this.jwt.sign({ payload: { id: user.id, role: user.role } })
    return { token }
  }

  // Current user (protected)
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  protected(@CurrentUser() user: AuthenticatedUser) {
    return user
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout() {
    // Pour l'instant, on retourne simplement un succès
    // Plus tard, on pourra ajouter une blacklist de tokens ici
    return { message: 'Logged out successfully' }
  }
}
