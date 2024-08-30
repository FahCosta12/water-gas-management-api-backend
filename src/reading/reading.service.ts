import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmReadingDto } from './dto/confirm-reading.dto';
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

    private async extractMeasureFromImage(imageBase64: string): Promise<number> {
        // Aqui vai chamar a API LLM ou IA para extrair a medida da imagem
        const apiKey = process.env.GEMINI_API_KEY;
        const geminiUrl = 'https://api.gemini.com/extract-measure'; // URL ficticia para simulação

        try {
            const response = await axios.post(
                geminiUrl,
                {
                    image: imageBase64,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (response.data && response.data.measure_value) {
                return response.data.measure_value;
            } else {
                throw new Error('Invalid response from Gemini API');
            }
        } catch (error) {
            throw new HttpException(
                'Erro ao extrair valor da image',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async confirmReadingDto(confirmReadingDto: ConfirmReadingDto): Promise<void> {
        const { measure_uuid, confirmed_value } = confirmReadingDto;

        const reading = await this.readingModel.findOne({ measure_uuid });

        if (!reading) {
            throw new HttpException('Leitura não encontrada', HttpStatus.NOT_FOUND);
        }

        if (reading.has_confirmed) {
            throw new HttpException('Leitura já confirmada', HttpStatus.CONFLICT);
        }

        reading.measure_value = confirmed_value
        reading.has_confirmed = true;

        await reading.save();
    }

    async listReadings(customerCode: string, measureType?: string): Promise<any> {
        const filter: any = { customer_code: customerCode.toUpperCase() };

        if (measureType) {
            if (['WATER', 'GAS'].includes(measureType.toUpperCase())) {
                filter.measure_type = measureType.toUpperCase();
            } else {
                throw new HttpException(
                    'Tipo de medição não permitida',
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        const readings = await this.readingModel.find(filter).exec();

        if (!readings) {
            throw new HttpException('Nenhuma leitura encontrada', HttpStatus.NOT_FOUND)
        }

        return {
            customer_code: customerCode,
            measures: readings.map((reading) => ({
                measure_uuid: reading.measure_uuid,
                measure_datetime: reading.measure_datetime,
                measure_type: reading.measure_type,
                has_confirmed: reading.has_confirmed,
                image_url: reading.image_url,
            })),
        };
    }
}
