import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import { Model } from 'mongoose';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { base64ToPngBlob } from "../utils/images";
import { ConfirmReadingDto } from './dto/confirm-reading.dto';
import { CreateReadingDto } from './dto/create-reading.dto';
import { Reading, ReadingDocument } from './schemas/reading.schema';

@Injectable()
export class ReadingService {
    constructor(
        @InjectModel(Reading.name) private readonly readingModel: Model<ReadingDocument>,
        private configService: ConfigService
    ) { }

    async create(createReadingDto: CreateReadingDto): Promise<any> {
        const { customer_code, measure_datetime, measure_type, image } = createReadingDto;

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

        const measure_value = await this.extractMeasureFromImage(image);

        const reading = new this.readingModel({
            ...createReadingDto,
            measure_value,
            measure_uuid: uuidv4(),
            image_url: image,
        });

        return reading.save()
    }

    private async extractMeasureFromImage(imageBase64: string): Promise<number> {
        const writeFile = promisify(fs.writeFile);
        const unlink = promisify(fs.unlink);
        const blob = base64ToPngBlob(imageBase64);
        const tempFilePath = path.join(__dirname, "measure-img.png");

        await writeFile(tempFilePath, Buffer.from(await blob.arrayBuffer()));

        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        const fileManager = new GoogleAIFileManager(apiKey);
        const uploadResponse = await fileManager.uploadFile(tempFilePath, {
            mimeType: "image/png",
            displayName: "measure-img",
        });
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
        });
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            },
            { text: "qual o valor exibido no leitor do relógio medidor de consumo." },
        ]);
        await unlink(tempFilePath);
        return Number(result.response.text())
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
