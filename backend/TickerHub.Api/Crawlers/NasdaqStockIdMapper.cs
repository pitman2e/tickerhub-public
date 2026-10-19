using StockHub.Exchanges.ConcreteExchanges;
using StockHub.Models;

namespace StockHub.Crawlers;

public static class NasdaqStockIdMapper
{
    public static string? Map(TickerParams tickerParams)
    {
        return tickerParams.MarketId switch
        {
            US.MARKET_ID => tickerParams.RawId,
            _ => null
        };
    }
}