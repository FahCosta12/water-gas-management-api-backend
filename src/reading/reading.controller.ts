import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { CreateReadingDto } from './dto/create-reading.dto';
import { ReadingService } from './reading.service';

@Controller('reading')
export class ReadingController {
    constructor(private readonly readingService: ReadingService) {}

    @Post('upload')
    async upload(@Body() createReadingDto: CreateReadingDto) {
        try {
            const result = await this.readingService.create(createReadingDto);
            return result;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
