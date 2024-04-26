import { toUrl } from "src/core/helpers/file.helper"
import { Nurse } from "src/infrastructure/entities/nurse/nurse.entity"

export class NurseResponse{
    id:string
    name:string
    avatar:string
    rating:number
    phone:string
    constructor(data:Partial<NurseResponse>){

        this.id=data.id
        this.name=data.name
        this.avatar=toUrl(data.avatar)
        this.rating=data.rating
        this.phone=data.phone
    }
}