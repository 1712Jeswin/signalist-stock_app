import { Schema, model, models } from 'mongoose';

const AlertSchema = new Schema({
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },
    targetPrice: { type: Number, required: true },
    condition: { type: String, enum: ['greater_than', 'less_than'], required: true },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

const AlertRecord = models?.AlertRecord || model('AlertRecord', AlertSchema);
export default AlertRecord;
