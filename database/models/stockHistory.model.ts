import mongoose from "mongoose";

const StockHistorySchema = new mongoose.Schema({
  symbol: { type: String, index: true },
  date: { type: Date, index: true },
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
});

StockHistorySchema.index({ symbol: 1, date: 1 }, { unique: true });

export default mongoose.models.StockHistory ||
  mongoose.model("StockHistory", StockHistorySchema);