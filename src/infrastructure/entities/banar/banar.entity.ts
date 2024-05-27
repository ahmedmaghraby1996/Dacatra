import { AuditableEntity } from 'src/infrastructure/base/auditable.entity';
import { Entity, Column } from 'typeorm';

@Entity()
export class Banar extends AuditableEntity {
    @Column()
    banar: string;

    @Column({nullable:true})
    started_at: Date;

    @Column({nullable:true})
    ended_at: Date;

    @Column({nullable:true})
    description: string;
    @Column({nullable:true})
    doctor_id:string;
    @Column()
    is_active: boolean;
}
