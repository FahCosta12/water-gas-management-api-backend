import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadingController } from './reading.controller';
import { ReadingService } from './reading.service';
import { Reading, ReadingSchema } from './schemas/reading.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reading.name, schema: ReadingSchema }]),
  ],
  providers: [ReadingService],
  controllers: [ReadingController],
})
export class ReadingModule {}