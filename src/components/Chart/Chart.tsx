import { ColorType, CrosshairMode, IChartApi, ISeriesApi, ITimeScaleApi, createChart } from '@felipecsl/lightweight-charts';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { loadChartHistory, selectKlines, selectTickerInfo } from '../../slices';
import { CandlestickDataWithVolume } from '../../types';
import { ChartTools } from './ChartTools';
import { LineControlManager } from './LineControlManager';
import { useAppDispatch, useAppSelector } from '../../hooks';

interface Props {
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
    volumeColor?: string;
  };
}

export const Chart: React.FC<Props> = (props) => {
  const {
    colors: {
      backgroundColor = 'white',
      textColor = 'black',
      areaTopColor = 'rgba(0, 0, 0, 0)',
      areaBottomColor = 'rgba(0, 0, 0, 0)',
      volumeColor = '#525151a0',
    } = {},
  } = props;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedChuncks, setLoadedChuncks] = useState<string[]>([]);

  const newSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const newVolumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const timeScaleRef = useRef<ITimeScaleApi | null>(null);
  const loadedChuncksRef = useRef<string[]>([]);

  const klines = useAppSelector(selectKlines);
  const tickerInfo = useAppSelector(selectTickerInfo);

  const dispatch = useAppDispatch();

  const handleResize = () => {
    if (!chartInstanceRef.current) {
      return;
    }
    chartInstanceRef.current.applyOptions({
      width: chartContainerRef.current?.clientWidth || 0,
      height: window.innerHeight - 75,
    });
  };

  const listenChartTimeScale = useCallback(
    () => {
      return loadHistoryCandles();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const loadHistoryCandles = debounce(() => {
    if (!timeScaleRef.current || !newSeries.current) {
      return;
    }

    const logicalRange = timeScaleRef.current.getVisibleLogicalRange();
    if (logicalRange !== null) {
      const barsInfo = newSeries.current.barsInLogicalRange(logicalRange);
      if (barsInfo !== null && barsInfo.barsBefore < 10) {
        if (loadedChuncksRef.current.includes(barsInfo.from as string)) {
          return;
        }
        setLoadedChuncks([...loadedChuncksRef.current, barsInfo.from as string]);

        dispatch(loadChartHistory(Number(barsInfo.from) * 1000));
      }
    }
  }, 50);

  const initChart = () => {
    if (!chartContainerRef.current || !tickerInfo) {
      return;
    }

    chartInstanceRef.current = createChart(chartContainerRef.current, {
      timeScale: {
        timeVisible: true,
        ticksVisible: true,
      },
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      rightPriceScale: {
        ticksVisible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: window.innerHeight - 75,
    });

    newSeries.current = chartInstanceRef.current.addCandlestickSeries({
      upColor: areaTopColor,
      downColor: areaBottomColor,
      priceFormat: {
        type: 'price',
        precision: Number(tickerInfo.priceScale),
        minMove: Number(tickerInfo.priceFilter.tickSize),
      },
    });

    const allKlines = JSON.parse(JSON.stringify(klines));
    newSeries.current.setData(allKlines);
    newVolumeSeries.current = chartInstanceRef.current.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
    });
    newVolumeSeries.current.priceScale().applyOptions({
      // set the positioning of the volume series
      scaleMargins: {
        top: 0.9, // highest point of the series will be 70% away from the top
        bottom: 0,
      },
    });

    const volumeData = allKlines.map((d: CandlestickDataWithVolume) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);

    timeScaleRef.current = chartInstanceRef.current.timeScale();
    timeScaleRef.current.subscribeVisibleLogicalRangeChange(listenChartTimeScale);
    timeScaleRef.current.fitContent();
  };

  const destroyChart = () => {
    if (!chartInstanceRef.current || !timeScaleRef.current) {
      return;
    }

    timeScaleRef.current.unsubscribeVisibleLogicalRangeChange(listenChartTimeScale);
    newSeries.current = null;
    newVolumeSeries.current = null;
    chartInstanceRef.current.remove();
    chartInstanceRef.current = null;
    timeScaleRef.current = null;
  };

  const updateChartData = (candles: CandlestickDataWithVolume[]) => {
    if (isLoading || !newSeries.current || !newVolumeSeries.current) return;

    newSeries.current.setData(JSON.parse(JSON.stringify(candles)));
    const volumeData = candles.map((d: CandlestickDataWithVolume) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);
  };

  // Handle Resize
  useEffect(() => {
    setIsLoading(true);
    initChart();
    setIsLoading(false);

    window.addEventListener('resize', handleResize);
    return () => {
      setIsLoading(true);
      destroyChart();
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build Chart
  useEffect(() => {
    updateChartData(klines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klines]);

  useEffect(() => {
    loadedChuncksRef.current = loadedChuncks;
  }, [loadedChuncks]);

  return (
    <div ref={chartContainerRef} className="relative w-full">
      {!isLoading && chartInstanceRef.current && newSeries.current ? (
        <>
          <ChartTools />
          <LineControlManager chartInstance={chartInstanceRef.current} seriesInstance={newSeries.current} />
        </>
      ) : null}
    </div>
  );
};
