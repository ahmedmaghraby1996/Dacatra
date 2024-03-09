import { Expose, Transform, plainToInstance } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
import { PharmacyAttachmentType } from 'src/infrastructure/data/enums/pharmacy-attachment-typs';
import { DrugCategory } from 'src/infrastructure/entities/pharmacy/drug-category.entity';

export class PharmacyResponse {
  @Expose()
  id: string;
  @Expose()
  ph_name: string;
  @Expose()
  open_time: string;
  @Expose()
  close_time: string;
  @Expose()
  expierence: number;

  @Expose()
  address: string;
  @Expose()
  summery: string;
  @Expose()
  latitude: number;
  @Expose()
  longitude: number;
  @Expose()
  created_at: Date;

  @Transform((value) => {
    return value.obj.attachments
      .filter((attachment) => attachment.type === PharmacyAttachmentType.LOGO)
      .map((attachment) => {
        return { image: toUrl(attachment.file), id: attachment.id };
      });
  })
  @Expose()
  logo: string[];

  @Transform((value) => {
    return value.obj.attachments
      .filter(
        (attachment) => attachment.type === PharmacyAttachmentType.LICENSE,
      )
      .map((attachment) => {
        return { mage: toUrl(attachment.file), id: attachment.id };
      });
  })
  @Expose()
  license: string[];

  @Expose()
  @Transform((value) => {
    return plainToInstance(DrugCategory, value.obj.categories);
  })
  categories: DrugCategory[];

  @Expose()
  is_verified: boolean;
}
