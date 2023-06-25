import { ColorType, CrosshairMode, IChartApi, ISeriesApi, ITimeScaleApi, createChart } from '@felipecsl/lightweight-charts';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { CandlestickDataWithVolume } from '../../types';
import { selectInterval, selectKlines, selectTickerInfo, selectklineUpdate } from '../../slices';
import { mapKlineToCandleStickData } from '../../mappers';
import { RestClientV5 } from 'bybit-api/lib/rest-client-v5';
import { debounce } from 'lodash';
import { ChartTools } from './ChartTools';
import { LineControlManager } from './LineControlManager';

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
  const [loadedCandles, setLoadedCandles] = useState<CandlestickDataWithVolume[]>([]);
  const [loadedChuncks, setLoadedChuncks] = useState<string[]>([]);

  const newSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const newVolumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const timeScaleRef = useRef<ITimeScaleApi | null>(null);
  const loadedCandlesRef = useRef<CandlestickDataWithVolume[]>([]);
  const loadedChuncksRef = useRef<string[]>([]);

  const klines = useSelector(selectKlines);
  const kline = useSelector(selectklineUpdate);
  const tickerInfo = useSelector(selectTickerInfo);
  const interval = useSelector(selectInterval);
  const apiClient = new RestClientV5();

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
      debounce(() => {
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
            apiClient
              .getKline({
                category: 'linear',
                symbol: tickerInfo?.symbol as string,
                interval: interval,
                end: Number(barsInfo.from) * 1000,
              })
              .then((r) => {
                const candleStickData = r.result.list
                  .map(mapKlineToCandleStickData)
                  .sort((a, b) => (a.time as number) - (b.time as number));
                const allData = [...candleStickData, ...loadedCandlesRef.current].sort((a, b) => (a.time as number) - (b.time as number));
                const uniqueArr = allData.filter((item, index) => {
                  return (
                    index ===
                    allData.findIndex((t) => {
                      return t.time === item.time;
                    })
                  );
                });

                setLoadedCandles(uniqueArr);
              });
          }
        }
      }, 50);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
    setLoadedCandles(allKlines);
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

  // Handle Resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Build Chart
  useEffect(() => {
    setIsLoading(true);
    if (!klines.length) return;
    initChart();

    setIsLoading(false);

    return () => {
      setIsLoading(true);
      destroyChart();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klines]);

  // Update Kline
  useEffect(() => {
    if (isLoading || !kline || !newSeries.current || !newVolumeSeries.current) {
      return;
    }
    const parsedKline = JSON.parse(JSON.stringify(kline)) as CandlestickDataWithVolume;
    newSeries.current.update(parsedKline);
    newVolumeSeries.current.update({ time: kline.time, value: kline.volume, color: 'pink' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kline]);

  // Update loaded candles
  useEffect(() => {
    loadedCandlesRef.current = loadedCandles;
    if (isLoading || !newSeries.current || !newVolumeSeries.current) return;

    newSeries.current.setData(loadedCandles);
    const volumeData = loadedCandles.map((d: CandlestickDataWithVolume) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedCandles]);

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
