import {
  Injectable,
  UnauthorizedException,
  createParamDecorator,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { FastifyRequest } from 'fastify'

// Claims signed at /signin. `payload` is the shape the frontend reads.
export type AuthenticatedUser = {
  payload: { id: string; role: 'ADMIN' | 'BENEVOLE' }
  iat: number
}

type AuthenticatedRequest = FastifyRequest & { user?: AuthenticatedUser }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'No Authorization was found in request.headers',
      )
    }

    try {
      request.user = await this.jwt.verifyAsync<AuthenticatedUser>(
        header.slice('Bearer '.length),
      )
    } catch {
      throw new UnauthorizedException('Authorization token is invalid')
    }
    return true
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
)
