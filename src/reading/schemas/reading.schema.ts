import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ReadingDocument = Reading & Document;

@Schema()
export class Reading {
    @Prop({required: true})
    customer_code: string;

    @Prop({required:true})
    measure_datetime: Date;

    @Prop({required: true, enum: ["WATER", "GAS "]})
    measure_type: string;

    @Prop({required: true})
    measure_value: number;

    @Prop({required: true})
    measure_uuid: string;

    @Prop({required: true})
    image_url: string;

    @Prop({default: false})
    has_confirmed: boolean;
}

export const ReadingSchema = SchemaFactory.createForClass(Reading);