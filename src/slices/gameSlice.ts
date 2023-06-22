import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { KlineIntervalV3, LinearInverseInstrumentInfoV5 } from 'bybit-api';
import { RestClientV5 } from 'bybit-api/lib/rest-client-v5';
import { mapKlineToCandleStickData } from '../mappers';
import { RootState } from '../store/store';
import { CandlestickDataWithVolume, IChartLine } from '../types';

type gameState = 'stopped' | 'playing';

interface IGame {
  loading: 'idle' | 'pending';
  errors: string[];
  symbol: string | undefined;
  tickers: LinearInverseInstrumentInfoV5[];
  klines: CandlestickDataWithVolume[];
  state: gameState;
  positionSize: number;
  chartLines: IChartLine[];
  interval: KlineIntervalV3;
}

const initialState: IGame = {
  loading: 'idle',
  errors: [],
  symbol: undefined,
  tickers: [],
  klines: [],
  state: 'stopped',
  positionSize: 0,
  chartLines: [],
  interval: '15',
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // updatePositionSize(state, action: PayloadAction<number>) {
    //   state.positionSize = action.payload;
    // },
    // addChartLine(state, action: PayloadAction<IChartLine>) {
    //   state.chartLines = [...state.chartLines, { ...action.payload }];
    // },
    // updateChartLine(state, action: PayloadAction<{ index: number; line: IChartLine }>) {
    //   state.chartLines[action.payload.index] = { ...action.payload.line };
    // },
    // removeChartLine(state, action: PayloadAction<{ index: number }>) {
    //   state.chartLines.splice(action.payload.index, 1);
    // },
    // // reset only when filled, to avoid rerender issues
    // resetChartLines(state) {
    //   if (state.chartLines.length) {
    //     state.chartLines = [];
    //   }
    // },
    // updateSymbol(state, action: PayloadAction<string>) {
    //   state.symbol = action.payload;
    // },
    // updateInterval(state, action: PayloadAction<KlineIntervalV3>) {
    //   state.interval = action.payload;
    // },
    // updateKlines(state, action: PayloadAction<CandlestickDataWithVolume[]>) {
    //   state.klines = [...action.payload];
    // },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGameData.fulfilled, (state, action) => {
        state.loading = 'idle';
        state.tickers = action.payload;
      })
      .addCase(loadGameData.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(loadGameData.rejected, (state) => {
        state.loading = 'idle';
      })
      .addCase(startGame.fulfilled, (state, action) => {
        state.loading = 'idle';
        const { symbol, klines } = action.payload as { symbol: string; klines: CandlestickDataWithVolume[] };
        state.symbol = symbol;
        state.klines = klines;
      })
      .addCase(startGame.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(startGame.rejected, (state) => {
        state.loading = 'idle';
      });
  },
});

// export const { updatePositionSize, resetChartLines, addChartLine, removeChartLine, updateChartLine } = gameSlice.actions;

export const gameReducer = gameSlice.reducer;

export const loadGameData = createAsyncThunk('game/load', async () => {
  const client = new RestClientV5();
  const tickersResponse = await client.getInstrumentsInfo({ category: 'linear' });
  return tickersResponse.result.list.filter((t) => t.symbol.toLowerCase().endsWith('usdt')) as LinearInverseInstrumentInfoV5[];
});

function getRandomString(strings: string[]) {
  const randomIndex = Math.floor(Math.random() * strings.length);
  return strings[randomIndex];
}

export const startGame = createAsyncThunk<unknown, void, { state: RootState }>('game/start', async (_, { getState }) => {
  const { tickers, interval } = getState().game;
  const randomSymbol = getRandomString(tickers.map((t) => t.symbol));

  const client = new RestClientV5();
  const klineResponse = await client.getKline({ category: 'linear', symbol: randomSymbol, interval });

  const klines = klineResponse.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));

  return { symbol: randomSymbol, klines };
});

// Other code such as selectors can use the imported `RootState` type
export const selectIsLoading = (state: RootState) => state.game.loading !== 'idle' || !state.game.klines.length;
export const selectErrors = (state: RootState) => state.game.errors;
export const selectTickers = (state: RootState) => state.game.tickers;
export const selectKlines = (state: RootState) => state.game.klines;
export const selectTicker = (state: RootState) => state.game.tickers.find(t => t.symbol === state.game.symbol);
export const selectInterval = (state: RootState) => state.game.interval;

// export const selectPositionSize = (state: RootState) => state.gameSlice.;
// export const selectTakeProfits = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'TP');
// export const selectStopLosses = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'SL');
// export const selectLines = (state: RootState) => state.tradeSetup.chartLines;
// export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
// export const selectEntryPrice = (state: RootState) =>
//   state.tradeSetup.chartLines.find((l) => l.type === 'ENTRY' && l.draggable === false)?.price.toString() ||
//   state.symbol.kline?.close ||
//   '0';
