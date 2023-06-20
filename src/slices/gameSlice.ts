import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { CandlestickDataWithVolume, IChartLine } from '../types';

interface ITradeSetupState {
  positionSize: number;
  chartLines: IChartLine[];
  symbol: string | undefined;
  interval: string;
  klines: CandlestickDataWithVolume[];
}

const initialState: ITradeSetupState = {
  positionSize: 0,
  chartLines: [],
  symbol: undefined,
  interval: '15',
  klines: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    updatePositionSize(state, action: PayloadAction<number>) {
      state.positionSize = action.payload;
    },
    addChartLine(state, action: PayloadAction<IChartLine>) {
      state.chartLines = [...state.chartLines, { ...action.payload }];
    },
    updateChartLine(state, action: PayloadAction<{ index: number; line: IChartLine }>) {
      state.chartLines[action.payload.index] = { ...action.payload.line };
    },
    removeChartLine(state, action: PayloadAction<{ index: number }>) {
      state.chartLines.splice(action.payload.index, 1);
    },
    // reset only when filled, to avoid rerender issues
    resetChartLines(state) {
      if (state.chartLines.length) {
        state.chartLines = [];
      }
    },

    updateSymbol(state, action: PayloadAction<string>) {
      state.symbol = action.payload;
    },
    updateInterval(state, action: PayloadAction<string>) {
      state.interval = action.payload;
    },
    updateKlines(state, action: PayloadAction<CandlestickDataWithVolume[]>) {
      state.klines = [...action.payload];
    },

  },
});

export const {
  updatePositionSize,
  resetChartLines,
  addChartLine,
  removeChartLine,
  updateChartLine,
} = gameSlice.actions;

export const gameReducer = gameSlice.reducer;

// // Other code such as selectors can use the imported `RootState` type
// export const selectPositionSize = (state: RootState) => state.gameSlice.;
// export const selectTakeProfits = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'TP');
// export const selectStopLosses = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'SL');
// export const selectLines = (state: RootState) => state.tradeSetup.chartLines;
// export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
// export const selectEntryPrice = (state: RootState) =>
//   state.tradeSetup.chartLines.find((l) => l.type === 'ENTRY' && l.draggable === false)?.price.toString() ||
//   state.symbol.kline?.close ||
//   '0';
