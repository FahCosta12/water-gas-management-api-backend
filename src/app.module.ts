import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceModule } from './controllador/service/service.module';
import { ReadingModule } from './reading/reading.module';

@Module({
  imports: [ServiceModule, ReadingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
