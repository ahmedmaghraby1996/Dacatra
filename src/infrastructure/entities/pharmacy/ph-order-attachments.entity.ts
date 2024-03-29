import { AuditableEntity } from "src/infrastructure/base/auditable.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { PhOrder } from "./ph-order.entity";
import { PhOrderAttachmentType } from "src/infrastructure/data/enums/pharmacy-attachment-typs";

@Entity()
export class PhOrderAttachments extends AuditableEntity {

@Column()
file:string

@Column()
type:PhOrderAttachmentType

@ManyToOne(()=>PhOrder,(phOrder)=>phOrder.ph_order_attachments)
@JoinColumn({name:'ph_order_id'})
ph_order:PhOrder

@Column()
ph_order_id:string

}