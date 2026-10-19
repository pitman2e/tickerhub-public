using System;
using StockHub.Exchanges.ConcreteExchanges;
using StockHub.Models;

namespace StockHub.Crawlers;

public static class AastocksStockIdMapper
{
    public static string? Map(TickerParams tickerParams)
    {
        return tickerParams.MarketId switch
        {
            US.MARKET_ID => tickerParams.RawId,
            HK.MARKET_ID => Convert.ToInt32(tickerParams.RawId).ToString("00000"),
            _ => null
        };
    }
}