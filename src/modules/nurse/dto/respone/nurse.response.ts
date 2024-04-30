import { toUrl } from "src/core/helpers/file.helper"
import { Nurse } from "src/infrastructure/entities/nurse/nurse.entity"

export class NurseResponse{
    id:string
    name:string
    avatar:string
    rating:number
    phone:string
    experience:number
    summery:string
    license_images:any
    is_verified:boolean
    user_id:string
    
    constructor(data:Partial<NurseResponse>){

        this.id=data.id
        this.name=data.name
        this.avatar=toUrl(data.avatar)
        this.rating=data.rating
        this.phone=data.phone
        this.license_images=data.license_images
        this.experience=data.experience
        this.summery=data.summery
        this.user_id=data.user_id
        this.is_verified=data.is_verified

    }
}