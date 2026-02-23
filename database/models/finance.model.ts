import { Schema, model, models } from "mongoose";

const IncomeSchema = new Schema({
    source: { type: String, required: true },
    planned: { type: Number, required: true, default: 0 },
    actual: { type: Number, required: true, default: 0 },
});

const ExpenseSchema = new Schema({
    category: { type: String, required: true },
    type: { type: String, enum: ['Fixed', 'Variable'], required: true },
    planned: { type: Number, required: true, default: 0 },
    actual: { type: Number, required: true, default: 0 },
});

const FinanceRecordSchema = new Schema({
    userId: { type: String, required: true, index: true },
    month: { type: String, required: true, index: true }, // Format: YYYY-MM
    incomes: [IncomeSchema],
    expenses: [ExpenseSchema],
    savingsGoal: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 },
    },
}, {
    timestamps: true
});

// Compound index to ensure one record per user per month
FinanceRecordSchema.index({ userId: 1, month: 1 }, { unique: true });

const FinanceRecord = models.FinanceRecord || model('FinanceRecord', FinanceRecordSchema);

export default FinanceRecord;
