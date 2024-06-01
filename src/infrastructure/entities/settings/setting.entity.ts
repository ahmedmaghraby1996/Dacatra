import { BaseEntity } from 'src/infrastructure/base/base.entity';
import { SettingsTypes } from 'src/infrastructure/data/enums/settings.enum';
import { Column, Entity } from 'typeorm';
@Entity()
export class AppSettings extends BaseEntity {
  @Column()
  value: number;

  @Column({ unique: true })
  type: SettingsTypes;
}
