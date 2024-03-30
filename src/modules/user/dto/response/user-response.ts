import { Expose } from "class-transformer";

export class UserResponse{
  
   @Expose()
   id: string;
   @Expose()
   first_name: string;
   @Expose()
   last_name: string;
   @Expose()
   email: string;
    

}