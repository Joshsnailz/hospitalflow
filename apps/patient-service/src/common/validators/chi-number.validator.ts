import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidChiNumber } from '../utils/chi-validator.util';

@ValidatorConstraint({ async: false })
export class IsChiNumberConstraint implements ValidatorConstraintInterface {
  validate(chi: string): boolean {
    return isValidChiNumber(chi);
  }

  defaultMessage(): string {
    return 'CHI number must be in format NPPPPPPPLPP (11 chars: digit 1-9, 7 digits, letter A-Z excluding O/U/V, 2 digits)';
  }
}

/**
 * Custom decorator for validating CHI numbers
 * @param validationOptions Optional validation options
 */
export function IsChiNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsChiNumberConstraint,
    });
  };
}
