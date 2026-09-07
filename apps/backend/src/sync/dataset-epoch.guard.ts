import {
  HttpException,
  HttpStatus,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { getClientContext } from '../client-context/client-context.js'
import { DatasetEpochService } from './dataset-epoch.service.js'

// Refuses requests from clients that synced against a previous lifetime of
// the database. Bodies are final: the exception filter sends them as is.
@Injectable()
export class DatasetEpochGuard implements CanActivate {
  constructor(
    private readonly epochs: DatasetEpochService,
    @InjectPinoLogger(DatasetEpochGuard.name)
    private readonly logger: PinoLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const { datasetEpoch } = getClientContext(request)
    const serverEpoch = this.epochs.epoch

    if (!datasetEpoch) {
      this.logger.warn('Request without dataset epoch refused')
      throw new HttpException(
        {
          code: 'EPOCH_REQUIRED',
          message: 'Le client doit indiquer son epoch de données.',
          serverEpoch,
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    if (datasetEpoch !== serverEpoch) {
      this.logger.warn(
        { clientEpoch: datasetEpoch },
        'Client synced against a previous database, refused',
      )
      throw new HttpException(
        {
          code: 'EPOCH_MISMATCH',
          message:
            'La base de données du serveur a été réinitialisée depuis la dernière synchronisation de ce poste.',
          serverEpoch,
        },
        HttpStatus.CONFLICT,
      )
    }

    return true
  }
}
