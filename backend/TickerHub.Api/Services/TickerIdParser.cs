using System.Diagnostics.CodeAnalysis;
using StockHub.Errors;
using StockHub.Exchanges;
using StockHub.Models;

namespace StockHub.Services;

public class TickerIdParser(AllExchanges allExchanges)
{
    public bool TryParseExact(
        string tickerId,
        [NotNullWhen(true)] out StockAdapter? stockAdapter)
    {
        stockAdapter = null;
        if (string.IsNullOrWhiteSpace(tickerId))
        {
            return false;
        }

        var separatorIndex = tickerId.LastIndexOf('.');
        if (separatorIndex <= 0 || separatorIndex == tickerId.Length - 1)
        {
            return false;
        }

        var marketId = tickerId[(separatorIndex + 1)..];
        return allExchanges.TryGetValue(marketId, out var exchange) &&
               exchange.TryParseExact(tickerId, out stockAdapter);
    }

    public StockAdapter ParseExact(string tickerId)
    {
        if (TryParseExact(tickerId, out var stockAdapter))
        {
            return stockAdapter;
        }

        throw new SHArgumentException("Invalid Exchange Id detected !");
    }
}