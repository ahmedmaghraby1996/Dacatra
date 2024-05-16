import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Package } from 'src/infrastructure/entities/subscription/package.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CreatePackageRequest } from './dto/requests/create-package-request';
import { plainToInstance } from 'class-transformer';
import { TransactionService } from '../transaction/transaction.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Transaction } from 'src/infrastructure/entities/wallet/transaction.entity';
import { MoreThan } from 'typeorm';
import { UpdatePackageRequest } from './dto/requests/update-package-request';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(Package) private packageRepository: Repository<Package>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @Inject(TransactionService)private readonly transactionService: TransactionService,
    @Inject(REQUEST) private request: Request,  
  ) {}

  async getSubscriptionPackages() {
    const packages = await this.packageRepository.find();
    return packages;
  }

  async makePackage(request: CreatePackageRequest) {
    const get_package = plainToInstance(Package, request);
    return await this.packageRepository.save(get_package);
  }
  async editPackage(request: UpdatePackageRequest) {
  
    return await this.packageRepository.update(request.id,request);
  }

  async deletePackage(request: string) {
  
    return await this.packageRepository.softDelete(request);
  }

  async makeSubscription(id: string) {
    const get_package = await this.packageRepository.findOneBy({
      id: id,
    })
    if(!get_package) throw new Error('package not found')
  await  this.transactionService.checkBalance(this.request.user.id, get_package.price)
await this.transactionService.makeTransaction(new Transaction({
  amount:get_package.price,
  receiver_id:null,
  user_id:this.request.user.id
})
  
)
    const subscription = plainToInstance(Subscription,new Subscription({
      package:get_package,
      expiration_date:new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      
      user_id:this.request.user.id
    }))
    return await this.subscriptionRepository.save(subscription)
  }

  async getCurrentSubscription() {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user_id: this.request.user.id,
        expiration_date: MoreThan(new Date()),
      },order:{created_at:'DESC'}
      ,
      relations: { package: true },
    });
    return subscription;
  }
}
