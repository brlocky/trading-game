import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { KlineIntervalV3, LinearInverseInstrumentInfoV5 } from 'bybit-api';
import { RestClientV5 } from 'bybit-api/lib/rest-client-v5';
import { mapKlineToCandleStickData } from '../mappers';
import { RootState } from '../store/store';
import { CandlestickDataWithVolume, IChartLine, IGameRisk, IGameTradeSide } from '../types';

type gameState = 'stopped' | 'playing';

interface IGamePosition {
  symbol: string;
  qty: string;
  value: string;
  price: string;
  side: IGameTradeSide;
  tp: string;
  sl: string;
}

interface IGameNewPosition {
  price: string;
  tp: string;
  sl: string;
}

interface IGameTrade {
  symbol: string;
  qty: string;
  price: string;
  exitPrice: string;
  side: IGameTradeSide;
  pnl: string;
}

interface IGame {
  loading: 'idle' | 'pending';
  errors: string[];
  symbol: string | undefined;
  tickers: LinearInverseInstrumentInfoV5[];
  klines: CandlestickDataWithVolume[];
  klinesFuture: CandlestickDataWithVolume[];
  trades: IGameTrade[];
  capital: number;
  risk: IGameRisk;
  position: IGamePosition | undefined;
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
  klinesFuture: [],
  trades: [],
  capital: 0,
  risk: 1,
  position: undefined,
  state: 'stopped',
  positionSize: 1,
  chartLines: [],
  interval: '60',
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addChartLine(state, action: PayloadAction<IChartLine>) {
      state.chartLines = [...state.chartLines, { ...action.payload }];
    },
    updateChartLine(state, action: PayloadAction<{ index: number; line: IChartLine }>) {
      state.chartLines[action.payload.index] = { ...action.payload.line };
    },
    removeChartLine(state, action: PayloadAction<{ index: number }>) {
      state.chartLines.splice(action.payload.index, 1);
    },
    updateRisk(state, action: PayloadAction<IGameRisk>) {
      state.risk = action.payload;
    },
    openPosition(state, action: PayloadAction<{ position: IGameNewPosition }>) {
      const { position } = action.payload;
      state.position = {
        symbol: state.symbol as string,
        qty: state.positionSize.toString(),
        value: (Number(position.price) * Number(state.positionSize)).toFixed(2),
        price: position.price,
        side: position.tp > position.sl ? 'Buy' : 'Sell',
        tp: position.tp,
        sl: position.sl,
      };
    },
    setupTrade(state) {
      const lastPrice = state.klines[state.klines.length - 1].close;
      const tp = lastPrice + lastPrice * 0.05;
      const sl = lastPrice - lastPrice * 0.05;
      state.chartLines = [
        {
          type: 'ENTRY',
          price: lastPrice.toString(),
          draggable: true,
        },
        {
          type: 'TP',
          price: tp.toString(),
          draggable: true,
        },
        {
          type: 'SL',
          price: sl.toString(),
          draggable: true,
        },
      ];

      const riskValue = state.capital * (state.risk / 100);
      state.positionSize = riskValue / (lastPrice - sl);
    },
    updatePositionSize(state) {
      if (!state.chartLines.length) {
        return;
      }
      const entry = Number(state.chartLines.find((l) => l.type === 'ENTRY')?.price);
      const sl = Number(state.chartLines.find((l) => l.type === 'SL')?.price);

      const riskValue = state.capital * (state.risk / 100);
      state.positionSize = riskValue / (entry - sl);
    },
    playChart(state) {
      if (!state.klinesFuture.length) {
        if (state.position) {
          const entryPrice = state.position.price;
          const exitPrice = state.klines[state.klines.length - 1].close.toString();
          const pnl =
            (state.position.side === 'Buy' ? Number(exitPrice) - Number(entryPrice) : Number(entryPrice) - Number(exitPrice)) *
            Number(state.position.qty);
          const newTrade = {
            symbol: state.symbol as string,
            qty: state.position.qty,
            price: entryPrice,
            exitPrice: exitPrice,
            side: state.position.side,
            pnl: pnl.toString(),
          };
          state.trades = [newTrade, ...state.trades];
          state.capital = state.capital + pnl;
          state.position = undefined;
          state.chartLines = [];
        }
        return;
      }

      const newBar = state.klinesFuture.splice(0, 1).pop() as CandlestickDataWithVolume;

      if (state.position) {
        const isTP = Number(state.position.tp) > newBar.low && Number(state.position.tp) < newBar.high;
        const isSL = Number(state.position.sl) > newBar.low && Number(state.position.sl) < newBar.high;
        if (isTP || isSL) {
          const entryPrice = state.position.price;
          const exitPrice = isTP ? state.position.tp : state.position.sl;
          const pnl =
            (state.position.side === 'Buy' ? Number(exitPrice) - Number(entryPrice) : Number(entryPrice) - Number(exitPrice)) *
            Number(state.position.qty);
          const newTrade = {
            symbol: state.symbol as string,
            qty: state.position.qty,
            price: entryPrice,
            exitPrice: exitPrice,
            side: state.position.side,
            pnl: pnl.toFixed(),
          };
          state.trades = [newTrade, ...state.trades];
          state.capital = state.capital + pnl;
          state.position = undefined;
          state.chartLines = [];
        }
      }

      state.klines = [...state.klines, newBar];
    },
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
        const { symbol, klines } = action.payload as { symbol: string; klines: CandlestickDataWithVolume[] };
        state.symbol = symbol;
        state.klines = klines.splice(0, 20) as CandlestickDataWithVolume[];
        state.klinesFuture = [...klines];
        state.trades = [];
        state.capital = 1000;
        state.position = undefined;
        state.state = 'stopped';
        state.positionSize = 1;
        state.loading = 'idle';
        state.chartLines = [];
      })
      .addCase(startGame.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(startGame.rejected, (state) => {
        state.loading = 'idle';
      })
      .addCase(skipChart.fulfilled, (state, action) => {
        const { symbol, klines } = action.payload as { symbol: string; klines: CandlestickDataWithVolume[] };
        state.symbol = symbol;
        state.klines = klines.splice(0, 20) as CandlestickDataWithVolume[];
        state.klinesFuture = [...klines];
        state.state = 'stopped';
        state.positionSize = 1;
        state.chartLines = [];

        state.loading = 'idle';
      })
      .addCase(skipChart.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(skipChart.rejected, (state) => {
        state.loading = 'idle';
      })
      .addCase(loadChartHistory.fulfilled, (state, action) => {
        const allData = [...action.payload, ...state.klines];
        state.klines = allData
          .filter((item, index) => {
            return (
              index ===
              allData.findIndex((t) => {
                return t.time === item.time;
              })
            );
          })
          .sort((a, b) => (a.time as number) - (b.time as number));
      });
  },
});

// export const { updatePositionSize, resetChartLines, addChartLine, removeChartLine, updateChartLine } = gameSlice.actions;
export const { addChartLine, removeChartLine, updateChartLine, playChart, openPosition, updateRisk, setupTrade, updatePositionSize } =
  gameSlice.actions;

export const gameReducer = gameSlice.reducer;

export const loadGameData = createAsyncThunk<LinearInverseInstrumentInfoV5[]>('game/loadGameData', async () => {
  const client = new RestClientV5();
  const tickersResponse = await client.getInstrumentsInfo({ category: 'linear' });
  const items = tickersResponse.result.list as LinearInverseInstrumentInfoV5[];
  return items.filter((t) => t.symbol.toLowerCase().endsWith('usdt'));
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
  const klines1 = klineResponse.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
  const end = Number(klines1[0].time) * 1000;
  const klineResponse1 = await client.getKline({ category: 'linear', symbol: randomSymbol, interval, end: end });
  const klines = [...klines1, ...klineResponse1.result.list.map(mapKlineToCandleStickData)].sort(
    (a, b) => (a.time as number) - (b.time as number),
  );

  return { symbol: randomSymbol, klines };
});

export const skipChart = createAsyncThunk<unknown, void, { state: RootState }>('game/skipchart', async (_, { getState }) => {
  const { tickers, interval } = getState().game;
  const randomSymbol = getRandomString(tickers.map((t) => t.symbol));

  const client = new RestClientV5();
  const klineResponse = await client.getKline({ category: 'linear', symbol: randomSymbol, interval });
  const klines1 = klineResponse.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
  const end = Number(klines1[0].time) * 1000;
  const klineResponse1 = await client.getKline({ category: 'linear', symbol: randomSymbol, interval, end: end });
  const klines = [...klines1, ...klineResponse1.result.list.map(mapKlineToCandleStickData)].sort(
    (a, b) => (a.time as number) - (b.time as number),
  );

  return { symbol: randomSymbol, klines };
});

export const loadChartHistory = createAsyncThunk<CandlestickDataWithVolume[], number, { state: RootState }>(
  'game/loadChartHistory',
  async (end, { getState }) => {
    const { symbol, interval } = getState().game;

    const client = new RestClientV5();
    const historyKlines = await client.getKline({
      category: 'linear',
      symbol: symbol as string,
      interval: interval,
      end: end,
    });

    return historyKlines.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
  },
);

// Other code such as selectors can use the imported `RootState` type
export const selectIsLoading = (state: RootState) => state.game.loading !== 'idle' || !state.game.klines.length;
export const selectErrors = (state: RootState) => state.game.errors;
export const selectTickers = (state: RootState) => state.game.tickers;
export const selectKlines = (state: RootState) => state.game.klines;
export const selectTickerInfo = (state: RootState) => state.game.tickers.find((t) => t.symbol === state.game.symbol);
export const selectInterval = (state: RootState) => state.game.interval;
export const selectCapital = (state: RootState) => state.game.capital;
export const selectRisk = (state: RootState) => state.game.risk;
export const selectTrades = (state: RootState) => state.game.trades;
export const selectTradeCount = (state: RootState) => state.game.trades.length;
export const selectCurrentPosition = (state: RootState) => state.game.position;
export const selectChartLines = (state: RootState) => state.game.chartLines;
export const selectPositionSize = (state: RootState) => state.game.positionSize;
export const selectEntryPrice = (state: RootState) => (state.game.position ? state.game.position.price : selectCurrentPrice(state));
export const selectCurrentPrice = (state: RootState) =>
  state.game.klines.length ? state.game.klines[state.game.klines.length - 1].close : 0;

// export const selectPositionSize = (state: RootState) => state.gameSlice.;
// export const selectTakeProfits = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'TP');
// export const selectStopLosses = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'SL');
// export const selectLines = (state: RootState) => state.tradeSetup.chartLines;
// export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
// export const selectEntryPrice = (state: RootState) =>
//   state.tradeSetup.chartLines.find((l) => l.type === 'ENTRY' && l.draggable === false)?.price.toString() ||
//   state.symbol.kline?.close ||
//   '0';
