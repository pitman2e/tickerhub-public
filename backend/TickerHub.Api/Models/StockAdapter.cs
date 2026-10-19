using StockHub.Exchanges;

namespace StockHub.Models;

public class StockAdapter
{
    public TickerParams TickerParams { get; }
    public IExchange Exchange { get; }

    public StockAdapter(IExchange exchange, string stockId, string? stockRawId = null)
    {
        Exchange = exchange;
        var rawId = stockRawId ?? new TickerParams(stockId).RawId;
        TickerParams = new TickerParams(exchange.GetStockId(rawId));
    }

    public string GetStockId() => TickerParams.Value;
}
