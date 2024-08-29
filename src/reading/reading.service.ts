import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { CreateReadingDto } from './dto/create-reading.dto';
import { Reading, ReadingDocument } from './schemas/reading.schema';
@Injectable()
export class ReadingService {
    constructor(
        @InjectModel(Reading.name) private readonly readingModel: Model<ReadingDocument>,

    ) { }

    async create(createReadingDto: CreateReadingDto): Promise<any> {
        const { customer_code, measure_datetime, measure_type } = createReadingDto;

        // Validação de leitura duplicada
        const existingReading = await this.readingModel.findOne({
            customer_code,
            measure_type,
            measure_datetime: {
                $gte: new Date(new Date(measure_datetime).getFullYear(), new Date(measure_datetime).getMonth(), 1),
                $lte: new Date(new Date(measure_datetime).getFullYear(), new Date(measure_datetime).getMonth() + 1, 0),
            },
        });

        if (existingReading) {
            throw new HttpException(
                'Leitura do mês já realizada.',
                HttpStatus.CONFLICT,
            );
        }

        // Chamando API externa para extrair o valor da imagem (simulção)
        const measure_value = this.extractMeasureFromImage(createReadingDto.image);

        const reading = new this.readingModel({
            ...createReadingDto,
            measure_value,
            measure_uuid: uuidv4(),
            image_url: 'https://storage.service.com/${uuidv4()}', //Simulação do link da imagem
        });

        return reading.save()
    }

    private extractMeasureFromImage(imageBase64: string): number {
        // Aqui vai chamar a API LLM ou IA para extrair a medida da imagem
        return Math.floor(Math.random() * 1000); // Simulação do valor extraído
    }
}
