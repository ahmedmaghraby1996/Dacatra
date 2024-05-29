import { BaseEntity } from 'src/infrastructure/base/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Drug } from './drug.entity';
import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';

@Entity()
export class DrugCategory extends AuditableEntity {
  @Column()
  name_ar: string;

  @Column()
  name_en: string;
  @OneToMany(() => Drug, (drug) => drug.category)
  drugs: Drug[];
  constructor(data: Partial<DrugCategory>) {
    super();
    Object.assign(this, data);
  }
}
