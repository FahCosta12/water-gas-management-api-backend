import { IsInt, IsNotEmpty, IsUUID, Min } from "class-validator";

export class ConfirmReadingDto {
    @IsUUID()
    @IsNotEmpty()
    measure_uuid: string;

    @IsInt()
    @Min(0)
    confirmed_value: number;
}