import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validateChiNumber, normalizeChiNumber } from '../utils/chi-validator.util';

@Injectable()
export class ParseChiPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const validation = validateChiNumber(value);

    if (!validation.isValid) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid CHI number format',
        errors: validation.errors,
      });
    }

    return normalizeChiNumber(value);
  }
}
