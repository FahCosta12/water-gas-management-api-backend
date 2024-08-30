import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ConfirmReadingDto } from './dto/confirm-reading.dto';
import { CreateReadingDto } from './dto/create-reading.dto';
import { ReadingService } from './reading.service';

@Controller('reading')
export class ReadingController {
    constructor(private readonly readingService: ReadingService) { }

    @Post('upload')
    async upload(@Body() createReadingDto: CreateReadingDto) {
        try {
            const result = await this.readingService.create(createReadingDto);
            return result;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Patch('confirm')
    async confirm(@Body() confirmReadingDto: ConfirmReadingDto) {
        try {
            await this.readingService.confirmReadingDto(confirmReadingDto);
            return { success: true };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get(':customer_code/list')
    async listReadings (
        @Param('customer_code') customerCode: string,
        @Query('measure_type') measureType?: string,
    ) {
        try {
            const readings = await this.readingService.listReadings(customerCode, measureType);
            return readings;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}