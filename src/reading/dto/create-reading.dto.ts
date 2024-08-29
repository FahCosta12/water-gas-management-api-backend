import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateReadingDto {
    @IsString()
    @IsNotEmpty()
    customer_code: string;

    @IsDateString()
    @IsNotEmpty()
    measure_datetime: string;

    @IsEnum(['WATER', 'GAS'])
    @IsNotEmpty()
    measure_type: string;

    @IsString()
    @IsNotEmpty()
    image: string;
}
