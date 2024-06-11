import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
  } from 'class-validator';
  import { Injectable } from '@nestjs/common';
  
  @Injectable()
  @ValidatorConstraint({ async: true })
  export class IsAdminConstraint implements ValidatorConstraintInterface {
    validate(specializationId: any, args: ValidationArguments) {
      const user = args.object['user']; // assuming user is available on the object being validated
  
      if (!user) {
        return false; // User not available in the validation context
      }
  
      return user.role === 'admin'; // Assuming the user object has a role property
    }
  
    defaultMessage(args: ValidationArguments) {
      return 'User must be an admin to set specialization_id';
    }
  }
  
  export function IsAdmin(validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator: IsAdminConstraint,
      });
    };
  }
  